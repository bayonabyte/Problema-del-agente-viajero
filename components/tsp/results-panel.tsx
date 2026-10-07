'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { type Cycle, type IncompleteCycle, type TspResult, formatRoute } from '@/lib/tsp'
import { type HighlightedRoute } from './graph-canvas'

type Props = {
  result: TspResult | null
  preview: HighlightedRoute | null
  selected: HighlightedRoute | null
  onPreview: (route: HighlightedRoute | null) => void
  onSelect: (route: HighlightedRoute | null) => void
  onExport: () => void
  onReset: () => void
  hasEdges: boolean
}

const PAGE_SIZE = 25

export function ResultsPanel({ result, preview, selected, onPreview, onSelect }: Props) {
  const cycles = useMemo(() => result?.cycles.map((cycle, index) => ({ cycle, index })).sort((a, b) => a.cycle.cost - b.cycle.cost) ?? [], [result])
  return <Card><CardHeader><CardTitle>Resultados de la exploración</CardTitle></CardHeader><CardContent className="flex flex-col gap-4">
    {!result && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Sin resultados todavía.</div>}
    {result?.best && <div className="grid gap-3 md:grid-cols-[auto_1fr_auto]"><Stat label="Ciclos Hamiltonianos" value={String(result.cycles.length)} /><div className="flex min-w-0 flex-col gap-2 rounded-lg border border-route/30 bg-route/5 p-4"><span className="flex items-center gap-1.5 text-xs font-medium text-route"><Trophy className="size-3.5" />Ruta óptima</span><span className="font-mono text-sm">{formatRoute(result.best.route)}</span></div><Stat label="Costo mínimo" value={String(result.best.cost)} accent /></div>}
    {result && !result.best && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Sin ciclo Hamiltoniano</AlertTitle><AlertDescription>Revisa los ciclos incompletos y agrega las aristas indicadas.</AlertDescription></Alert>}
    {result && <div className="flex flex-col gap-4"><CycleList key={`valid-${result.elapsedMs}`} cycles={cycles} best={result.best} preview={preview} selected={selected} onPreview={onPreview} onSelect={onSelect} /><IncompleteCycleList key={`incomplete-${result.elapsedMs}`} cycles={result.incompleteCycles} preview={preview} selected={selected} onPreview={onPreview} onSelect={onSelect} /></div>}
  </CardContent></Card>
}

function CycleList({ cycles, best, preview, selected, onPreview, onSelect }: { cycles: Array<{ cycle: Cycle; index: number }>; best: Cycle | null; preview: HighlightedRoute | null; selected: HighlightedRoute | null; onPreview: (route: HighlightedRoute | null) => void; onSelect: (route: HighlightedRoute | null) => void }) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(cycles.length / PAGE_SIZE))
  const visible = cycles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  return <section className="min-w-0 rounded-lg border"><Header title={`Ciclos Hamiltonianos (${cycles.length})`} description="Rutas válidas que usan aristas existentes." /><div className="max-h-96 overflow-auto"><Table><TableHeader className="sticky top-0 bg-card"><TableRow><TableHead>#</TableHead><TableHead>Ruta</TableHead><TableHead className="text-right">Costo</TableHead></TableRow></TableHeader><TableBody>{visible.length === 0 ? <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">No se encontraron ciclos válidos.</TableCell></TableRow> : visible.map(({ cycle, index }) => { const route: HighlightedRoute = { id: `valid-${index}`, route: cycle.route, kind: 'preview' }; const active = selected?.id === route.id || (!selected && preview?.id === route.id); return <TableRow key={index} tabIndex={0} onMouseEnter={() => onPreview(route)} onMouseLeave={() => onPreview(null)} onFocus={() => onPreview(route)} onClick={() => onSelect(selected?.id === route.id ? null : route)} className={cn('cursor-pointer', active && 'bg-preview/10')}><TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell><TableCell className="font-mono text-xs">{formatRoute(cycle.route)}</TableCell><TableCell className="text-right font-mono">{cycle.cost === best?.cost && <Badge className="mr-1 bg-route text-white">óptimo</Badge>}{cycle.cost}</TableCell></TableRow> })}</TableBody></Table></div><Pager page={page} pageCount={pageCount} setPage={setPage} /></section>
}

function IncompleteCycleList({ cycles, preview, selected, onPreview, onSelect }: { cycles: IncompleteCycle[]; preview: HighlightedRoute | null; selected: HighlightedRoute | null; onPreview: (route: HighlightedRoute | null) => void; onSelect: (route: HighlightedRoute | null) => void }) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(cycles.length / PAGE_SIZE))
  const visible = cycles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  return <section className="min-w-0 rounded-lg border"><Header title={`Ciclos incompletos (${cycles.length})`} description="Al seleccionar uno: azul para aristas existentes y rojo discontinuo para las faltantes." /><div className="max-h-96 overflow-auto"><Table><TableHeader className="sticky top-0 bg-card"><TableRow><TableHead>Ruta candidata</TableHead><TableHead>Aristas faltantes</TableHead></TableRow></TableHeader><TableBody>{visible.map((cycle, index) => { const route: HighlightedRoute = { id: `incomplete-${page}-${index}`, route: cycle.route, kind: 'incomplete', missingEdges: cycle.missingEdges }; const active = selected?.id === route.id || (!selected && preview?.id === route.id); return <TableRow key={route.id} tabIndex={0} onMouseEnter={() => onPreview(route)} onMouseLeave={() => onPreview(null)} onFocus={() => onPreview(route)} onClick={() => onSelect(selected?.id === route.id ? null : route)} className={cn('cursor-pointer', active && 'bg-destructive/10')}><TableCell className="font-mono text-xs">{formatRoute(cycle.route)}</TableCell><TableCell className="font-mono text-xs text-destructive">{cycle.missingEdges.map(([from, to]) => `${from}–${to}`).join(', ')}</TableCell></TableRow> })}</TableBody></Table></div><Pager page={page} pageCount={pageCount} setPage={setPage} /></section>
}

function Header({ title, description }: { title: string; description: string }) { return <div className="border-b p-3"><h2 className="font-medium">{title}</h2><p className="text-xs text-muted-foreground">{description}</p></div> }
function Pager({ page, pageCount, setPage }: { page: number; pageCount: number; setPage: (update: (page: number) => number) => void }) { if (pageCount <= 1) return null; return <div className="flex items-center justify-end gap-2 border-t p-2"><Button variant="outline" size="icon-xs" aria-label="Página anterior" disabled={page === 0} onClick={() => setPage((current) => current - 1)}><ChevronLeft /></Button><span className="text-xs">{page + 1} / {pageCount}</span><Button variant="outline" size="icon-xs" aria-label="Página siguiente" disabled={page === pageCount - 1} onClick={() => setPage((current) => current + 1)}><ChevronRight /></Button></div> }
function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) { return <div className="flex min-w-36 flex-col gap-1 rounded-lg border bg-muted/40 p-4"><span className="text-xs text-muted-foreground">{label}</span><span className={cn('text-3xl font-semibold', accent && 'text-route')}>{value}</span></div> }
