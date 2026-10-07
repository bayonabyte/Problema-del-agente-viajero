'use client'

import { useMemo, useState } from 'react'
import { Route } from 'lucide-react'
import {
  type Edge,
  type TspResult,
  buildMatrix,
  generateRandomGraph,
  solveTsp,
} from '@/lib/tsp'
import { ConfigPanel } from './config-panel'
import { GraphCanvas, type HighlightedRoute } from './graph-canvas'
import { CostMatrix } from './cost-matrix'
import { ResultsPanel } from './results-panel'

export type Mode = 'random' | 'manual'

export function TspDashboard() {
  const [nodeCount, setNodeCount] = useState(6)
  const [mode, setMode] = useState<Mode>('random')
  const [edges, setEdges] = useState<Edge[]>([])
  const [range, setRange] = useState({ min: 1, max: 20 })
  const [result, setResult] = useState<TspResult | null>(null)
  const [preview, setPreview] = useState<HighlightedRoute | null>(null)
  const [selected, setSelected] = useState<HighlightedRoute | null>(null)

  const matrix = useMemo(() => buildMatrix(nodeCount, edges), [nodeCount, edges])

  const invalidate = () => {
    setResult(null)
    setPreview(null)
    setSelected(null)
  }

  const handleNodeCount = (n: number) => {
    setNodeCount(n)
    setEdges((prev) => prev.filter((e) => e.u <= n && e.v <= n))
    invalidate()
  }

  const handleEdges = (next: Edge[]) => {
    setEdges(next)
    invalidate()
  }

  const handleGenerate = () => {
    handleEdges(generateRandomGraph(nodeCount, range.min, range.max))
  }

  const handleSolve = () => {
    setPreview(null)
    setSelected(null)
    setResult(solveTsp(nodeCount, edges))
  }

  const handleReset = () => {
    setEdges([])
    invalidate()
  }

  const handleExport = () => {
    const payload = {
      nodes: nodeCount,
      edges,
      matrix: matrix.map((row) => row.map((v) => (v === Infinity ? null : v))),
      result: result && {
        totalCycles: result.cycles.length,
        optimalRoute: result.best?.route ?? null,
        minimumCost: result.best?.cost ?? null,
        cycles: result.cycles,
      },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tsp-${nodeCount}-nodos.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const highlighted = selected ?? preview ?? (result?.best
    ? { id: 'optimal', route: result.best.route, kind: 'optimal' as const }
    : null)

  return (
    <div className="min-h-dvh bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-4 md:px-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Route className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-balance">
              Problema del Viajante (TSP)
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-4 p-4 md:p-6 lg:grid-cols-[340px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <ConfigPanel
            nodeCount={nodeCount}
            onNodeCountChange={handleNodeCount}
            mode={mode}
            onModeChange={setMode}
            edges={edges}
            onEdgesChange={handleEdges}
            range={range}
            onRangeChange={setRange}
            onGenerate={handleGenerate}
            onSolve={handleSolve}
            onReset={handleReset}
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
            <GraphCanvas
              nodeCount={nodeCount}
              edges={edges}
              highlighted={highlighted}
            />
            <CostMatrix
              matrix={matrix}
              highlightedRoute={highlighted?.route ?? null}
              missingEdges={highlighted?.missingEdges ?? []}
              highlightKind={highlighted?.kind ?? null}
            />
          </div>
          <ResultsPanel
            result={result}
            preview={preview}
            selected={selected}
            onPreview={setPreview}
            onSelect={setSelected}
            onExport={handleExport}
            onReset={handleReset}
            hasEdges={edges.length > 0}
          />
        </div>
      </main>
    </div>
  )
}
