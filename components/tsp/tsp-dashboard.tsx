'use client'

import { useMemo, useState } from 'react'
import { Route } from 'lucide-react'
import {
  type Edge,
  type TspResult,
  SAMPLE_EDGES,
  buildMatrix,
  generateRandomGraph,
  solveTsp,
} from '@/lib/tsp'
import { ConfigPanel } from './config-panel'
import { GraphCanvas } from './graph-canvas'
import { CostMatrix } from './cost-matrix'
import { ResultsPanel } from './results-panel'

export type Mode = 'random' | 'manual'

export function TspDashboard() {
  const [nodeCount, setNodeCount] = useState(6)
  const [mode, setMode] = useState<Mode>('random')
  const [edges, setEdges] = useState<Edge[]>(SAMPLE_EDGES)
  const [range, setRange] = useState({ min: 1, max: 20 })
  const [result, setResult] = useState<TspResult | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const matrix = useMemo(() => buildMatrix(nodeCount, edges), [nodeCount, edges])

  const invalidate = () => {
    setResult(null)
    setPreviewIndex(null)
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
    setPreviewIndex(null)
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

  const highlighted =
    previewIndex !== null && result
      ? { route: result.cycles[previewIndex].route, kind: 'preview' as const }
      : result?.best
        ? { route: result.best.route, kind: 'optimal' as const }
        : null

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
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
            <GraphCanvas
              nodeCount={nodeCount}
              edges={edges}
              highlighted={highlighted}
            />
            <CostMatrix matrix={matrix} highlightedRoute={highlighted?.route ?? null} />
          </div>
          <ResultsPanel
            result={result}
            previewIndex={previewIndex}
            onPreview={setPreviewIndex}
            onExport={handleExport}
            onReset={handleReset}
            hasEdges={edges.length > 0}
          />
        </div>
      </main>
    </div>
  )
}