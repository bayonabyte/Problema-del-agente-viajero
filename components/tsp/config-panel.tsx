'use client'

import { useState } from 'react'
import { Dices, Hand, Play, Plus, RotateCcw, Shuffle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type Edge, MAX_NODES, MIN_NODES, edgeKey } from '@/lib/tsp'
import type { Mode } from './tsp-dashboard'

type Props = {
  nodeCount: number
  onNodeCountChange: (n: number) => void
  mode: Mode
  onModeChange: (m: Mode) => void
  edges: Edge[]
  onEdgesChange: (edges: Edge[]) => void
  range: { min: number; max: number }
  onRangeChange: (r: { min: number; max: number }) => void
  onGenerate: () => void
  onSolve: () => void
  onReset: () => void
}

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function ConfigPanel({
  nodeCount,
  onNodeCountChange,
  mode,
  onModeChange,
  edges,
  onEdgesChange,
  range,
  onRangeChange,
  onGenerate,
  onSolve,
  onReset,
}: Props) {
  const nodes = Array.from({ length: nodeCount }, (_, i) => i + 1)
  const [from, setFrom] = useState('1')
  const [to, setTo] = useState('2')
  const [weight, setWeight] = useState('5')
  const [error, setError] = useState<string | null>(null)

  const addEdge = (e: React.FormEvent) => {
    e.preventDefault()
    const u = Number(from)
    const v = Number(to)
    const w = Number(weight)
    if (u === v) return setError('No se permiten lazos: el nodo origen y destino deben ser distintos.')
    if (!Number.isFinite(w) || w <= 0) return setError('El peso debe ser un número positivo.')
    if (edges.some((ed) => edgeKey(ed.u, ed.v) === edgeKey(u, v)))
      return setError(`La arista ${Math.min(u, v)}–${Math.max(u, v)} ya existe.`)
    setError(null)
    onEdgesChange(
      [...edges, { u: Math.min(u, v), v: Math.max(u, v), w }].sort(
        (a, b) => a.u - b.u || a.v - b.v,
      ),
    )
  }

  const removeEdge = (key: string) => {
    onEdgesChange(edges.filter((ed) => edgeKey(ed.u, ed.v) !== key))
  }

  const safeFrom = Number(from) > nodeCount ? '1' : from
  const safeTo = Number(to) > nodeCount ? '2' : to

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del grafo</CardTitle>
        <CardDescription>Define los nodos del 5 al 10</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="node-count">Número de nodos</Label>
            <Input
              id="node-count"
              type="number"
              min={MIN_NODES}
              max={MAX_NODES}
              value={nodeCount}
              onChange={(e) => {
                const n = Math.round(Number(e.target.value))
                if (n >= MIN_NODES && n <= MAX_NODES) onNodeCountChange(n)
              }}
              className="h-8 w-16 text-center tabular-nums"
            />
          </div>
          <Slider
            aria-label="Número de nodos"
            min={MIN_NODES}
            max={MAX_NODES}
            step={1}
            value={[nodeCount]}
            onValueChange={(v) => onNodeCountChange(Array.isArray(v) ? v[0] : v)}
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{MIN_NODES}</span>
            <span>{MAX_NODES}</span>
          </div>
        </div>

        <Separator />

        <Tabs value={mode} onValueChange={(v) => onModeChange(v as Mode)}>
          <TabsList className="w-full">
            <TabsTrigger value="random">
              <Dices aria-hidden="true" />
              Modo Aleatorio
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Hand aria-hidden="true" />
              Modo Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="random" className="flex flex-col gap-4 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="min-w">Peso mínimo</Label>
                <Input
                  id="min-w"
                  type="number"
                  min={1}
                  value={range.min}
                  onChange={(e) => onRangeChange({ ...range, min: Math.max(1, Number(e.target.value) || 1) })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="max-w">Peso máximo</Label>
                <Input
                  id="max-w"
                  type="number"
                  min={1}
                  max={20}
                  value={range.max}
                  onChange={(e) => onRangeChange({ ...range, max: Math.max(1, Number(e.target.value) || 1) })}
                />
              </div>
            </div>
            <Button variant="outline" onClick={onGenerate}>
              <Shuffle aria-hidden="true" />
              Generar Grafo Aleatorio
            </Button>
          </TabsContent>

          <TabsContent value="manual" className="flex flex-col gap-3 pt-3">
            <form onSubmit={addEdge} className="flex flex-col gap-3" noValidate>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edge-u">Nodo 1</Label>
                  <select id="edge-u" className={selectClass} value={safeFrom} onChange={(e) => setFrom(e.target.value)}>
                    {nodes.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edge-v">Nodo 2</Label>
                  <select id="edge-v" className={selectClass} value={safeTo} onChange={(e) => setTo(e.target.value)}>
                    {nodes.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edge-w">Peso</Label>
                  <Input id="edge-w" type="number" min={1} value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
              </div>
              {error && (
                <p role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" variant="outline">
                <Plus aria-hidden="true" />
                Agregar arista
              </Button>
            </form>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium">Aristas</span>
              <span className="text-xs text-muted-foreground tabular-nums">{edges.length} en total</span>
            </div>
            {edges.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                Aún no hay aristas. Agrega la primera arriba.
              </p>
            ) : (
              <ScrollArea className="h-52 rounded-lg border">
                <ul className="divide-y">
                  {edges.map((ed) => {
                    const key = edgeKey(ed.u, ed.v)
                    return (
                      <li key={key} className="flex items-center justify-between px-3 py-1.5 text-sm">
                        <span className="font-mono tabular-nums">
                          {ed.u} — {ed.v}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs tabular-nums">w = {ed.w}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeEdge(key)}
                            aria-label={`Eliminar arista ${ed.u}–${ed.v}`}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        <Button size="lg" onClick={onSolve} disabled={edges.length === 0}>
          <Play aria-hidden="true" />
          Resolver TSP
        </Button>
        <Button variant="outline" onClick={onReset} disabled={edges.length === 0}>
          <RotateCcw aria-hidden="true" />
          Limpiar grafo
        </Button>
      </CardContent>
    </Card>
  )
}
