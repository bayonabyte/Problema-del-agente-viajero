'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type Edge, edgeKey } from '@/lib/tsp'

type Props = {
  nodeCount: number
  edges: Edge[]
  highlighted: { route: number[]; kind: 'optimal' | 'preview' } | null
}

const SIZE = 440
const CENTER = SIZE / 2
const RADIUS = 160
const NODE_R = 20

function position(i: number, n: number) {
  const angle = (2 * Math.PI * i) / n - Math.PI / 2
  return { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle), angle }
}

export function GraphCanvas({ nodeCount, edges, highlighted }: Props) {
  const positions = useMemo(
    () => Array.from({ length: nodeCount }, (_, i) => position(i, nodeCount)),
    [nodeCount],
  )

  const routeEdges = useMemo(() => {
    const map = new Map<string, { from: number; to: number }>()
    if (!highlighted) return map
    const r = highlighted.route
    for (let i = 0; i < r.length - 1; i++) map.set(edgeKey(r[i], r[i + 1]), { from: r[i], to: r[i + 1] })
    return map
  }, [highlighted])

  const order = useMemo(() => {
    const m = new Map<number, number>()
    highlighted?.route.slice(0, -1).forEach((node, i) => m.set(node, i + 1))
    return m
  }, [highlighted])

  const accent = highlighted?.kind === 'preview' ? 'var(--preview)' : 'var(--route)'

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Visualización del grafo</CardTitle>
        <CardDescription>
          {highlighted
            ? highlighted.kind === 'optimal'
              ? 'Ruta óptima resaltada; los números indican el orden de visita.'
              : 'Vista previa de la ruta seleccionada.'
            : `${nodeCount} nodos · ${edges.length} aristas`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="mx-auto aspect-square w-full max-w-[520px]"
          role="img"
          aria-label={`Grafo con ${nodeCount} nodos y ${edges.length} aristas`}
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={accent} />
            </marker>
          </defs>

          {edges.map((e) => {
            const key = edgeKey(e.u, e.v)
            if (routeEdges.has(key)) return null
            const a = positions[e.u - 1]
            const b = positions[e.v - 1]
            if (!a || !b) return null
            return (
              <line
                key={key}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--edge)"
                strokeWidth={1.5}
                opacity={highlighted ? 0.45 : 1}
              />
            )
          })}

          {[...routeEdges.entries()].map(([key, { from, to }]) => {
            const a = positions[from - 1]
            const b = positions[to - 1]
            const dx = b.x - a.x
            const dy = b.y - a.y
            const len = Math.hypot(dx, dy)
            const ox = (dx / len) * (NODE_R + 3)
            const oy = (dy / len) * (NODE_R + 3)
            return (
              <line
                key={key}
                x1={a.x + ox}
                y1={a.y + oy}
                x2={b.x - ox}
                y2={b.y - oy}
                stroke={accent}
                strokeWidth={4}
                strokeLinecap="round"
                markerEnd="url(#arrow)"
                strokeDasharray={highlighted?.kind === 'preview' ? '8 5' : undefined}
              />
            )
          })}

          {edges.map((e) => {
            const a = positions[e.u - 1]
            const b = positions[e.v - 1]
            if (!a || !b) return null
            const onRoute = routeEdges.has(edgeKey(e.u, e.v))
            const mx = (a.x + b.x) / 2
            const my = (a.y + b.y) / 2
            const label = String(e.w)
            const w = label.length * 7 + 10
            return (
              <g key={`w-${e.u}-${e.v}`}>
                <rect
                  x={mx - w / 2}
                  y={my - 9}
                  width={w}
                  height={18}
                  rx={5}
                  fill={onRoute ? accent : 'var(--card)'}
                  stroke={onRoute ? accent : 'var(--edge)'}
                />
                <text
                  x={mx}
                  y={my + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  className="font-mono"
                  fill={onRoute ? 'white' : 'var(--muted-foreground)'}
                >
                  {label}
                </text>
              </g>
            )
          })}

          {positions.map((p, i) => {
            const node = i + 1
            const step = order.get(node)
            const bx = CENTER + (RADIUS + 36) * Math.cos(p.angle)
            const by = CENTER + (RADIUS + 36) * Math.sin(p.angle)
            return (
              <g key={node}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={NODE_R}
                  fill="var(--node)"
                  stroke={step ? accent : 'var(--node-stroke)'}
                  strokeWidth={step ? 3 : 1.5}
                />
                <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--node-foreground)">
                  {node}
                </text>
                {step && (
                  <g>
                    <circle cx={bx} cy={by} r={10} fill={accent} />
                    <text x={bx} y={by + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="white">
                      {step}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </CardContent>
    </Card>
  )
}
