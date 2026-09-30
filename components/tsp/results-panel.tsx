'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { type TspResult, formatRoute } from '@/lib/tsp'

type Props = {
  result: TspResult | null
  previewIndex: number | null
  onPreview: (i: number | null) => void
  onExport: () => void
  onReset: () => void
  hasEdges: boolean
}

const PAGE_SIZE = 25

export function ResultsPanel({ result, previewIndex, onPreview, onExport, onReset, hasEdges }: Props) {
  const [open, setOpen] = useState(true)
  const [sortByCost, setSortByCost] = useState(false)
  const [page, setPage] = useState(0)
  const [pinned, setPinned] = useState<number | null>(null)
  const [lastResult, setLastResult] = useState(result)

  if (lastResult !== result) {
    setLastResult(result)
    setPage(0)
    setPinned(null)
  }

  const indices = useMemo(() => {
    if (!result) return []
    const idx = result.cycles.map((_, i) => i)
    if (sortByCost) idx.sort((a, b) => result.cycles[a].cost - result.cycles[b].cost || a - b)
    return idx
  }, [result, sortByCost])

  const pageCount = Math.max(1, Math.ceil(indices.length / PAGE_SIZE))
  const visible = indices.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const best = result?.best ?? null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!result && (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Sin resultados todavía.
          </div>
        )}

        {result && !best && (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>Sin solución</AlertTitle>
            <AlertDescription>
              El grafo no contiene un ciclo Hamiltoniano; no se puede resolver el TSP.
            </AlertDescription>
          </Alert>
        )}

        {result && best && (
          <>
            <div className="grid gap-3 md:grid-cols-[auto_1fr_auto]">
              <Stat label="Ciclos Hamiltonianos" value={result.cycles.length.toLocaleString('es')} />
              <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-route/30 bg-route/5 p-4">
                <span className="flex items-center gap-1.5 text-xs font-medium text-route">
                  <Trophy className="size-3.5" aria-hidden="true" />
                  Ruta óptima
                </span>
                <div className="flex flex-wrap items-center gap-1" aria-label={formatRoute(best.route)}>
                  {best.route.map((node, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <Badge className="bg-route font-mono text-white tabular-nums">{node}</Badge>
                      {i < best.route.length - 1 && (
                        <span className="text-muted-foreground" aria-hidden="true">
                          →
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <Stat label="Costo mínimo" value={String(best.cost)} accent />
            </div>

            <div className="rounded-lg border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  aria-expanded={open}
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <ChevronDown className={cn('size-4 transition-transform', !open && '-rotate-90')} aria-hidden="true" />
                  Ciclos detectados
                </button>
                
              </div>

              {open && (
                <>
                  <div className="max-h-96 overflow-y-auto" onMouseLeave={() => onPreview(pinned)}>
                    <Table>
                      <TableHeader className="sticky top-0 bg-card">
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead>Ruta</TableHead>
                          <TableHead className="w-28 text-right">Costo total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visible.map((i) => {
                          const c = result.cycles[i]
                          const isBest = c.cost === best.cost
                          const isActive = previewIndex === i
                          return (
                            <TableRow
                              key={i}
                              tabIndex={0}
                              aria-selected={pinned === i}
                              onMouseEnter={() => onPreview(i)}
                              onFocus={() => onPreview(i)}
                              onClick={() => {
                                const next = pinned === i ? null : i
                                setPinned(next)
                                onPreview(next)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  const next = pinned === i ? null : i
                                  setPinned(next)
                                  onPreview(next)
                                }
                              }}
                              className={cn(
                                'cursor-pointer',
                                isActive && 'bg-preview/10 hover:bg-preview/10',
                                pinned === i && 'ring-1 ring-inset ring-preview',
                              )}
                            >
                              <TableCell className="font-mono text-muted-foreground tabular-nums">{i + 1}</TableCell>
                              <TableCell className="font-mono text-sm">{formatRoute(c.route)}</TableCell>
                              <TableCell className="text-right font-mono tabular-nums">
                                <span className="inline-flex items-center gap-2">
                                  {isBest && (
                                    <Badge className="bg-route text-white" aria-label="Óptimo">
                                      óptimo
                                    </Badge>
                                  )}
                                  <span className={cn(isBest && 'font-semibold text-route')}>{c.cost}</span>
                                </span>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {pageCount > 1 && (
                    <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, indices.length)} de{' '}
                        {indices.length.toLocaleString('es')}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => setPage((p) => Math.max(0, p - 1))}
                          disabled={page === 0}
                          aria-label="Página anterior"
                        >
                          <ChevronLeft aria-hidden="true" />
                        </Button>
                        <span className="px-2 tabular-nums">
                          {page + 1} / {pageCount}
                        </span>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                          disabled={page >= pageCount - 1}
                          aria-label="Página siguiente"
                        >
                          <ChevronRight aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex min-w-36 flex-col gap-1 rounded-lg border bg-muted/40 p-4">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn('text-3xl font-semibold tabular-nums', accent && 'text-route')}>{value}</span>
    </div>
  )
}