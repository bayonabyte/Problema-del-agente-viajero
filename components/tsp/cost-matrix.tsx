import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { edgeKey } from '@/lib/tsp'

type Props = {
  matrix: number[][]
  highlightedRoute: number[] | null
  missingEdges: Array<[number, number]>
  highlightKind: 'optimal' | 'preview' | 'incomplete' | null
}

export function CostMatrix({ matrix, highlightedRoute, missingEdges, highlightKind }: Props) {
  const onRoute = new Set<string>()
  const suggested = new Set(missingEdges.map(([from, to]) => edgeKey(from, to)))
  for (let index = 0; highlightedRoute && index < highlightedRoute.length - 1; index++) {
    onRoute.add(edgeKey(highlightedRoute[index], highlightedRoute[index + 1]))
  }
  const routeColor = highlightKind === 'optimal' ? 'bg-route text-white' : 'bg-preview text-white'

  return <Card className="min-w-0"><CardHeader><CardTitle>Matriz de costos</CardTitle><CardDescription>Azul: conexión de la ruta. Gris: sugerencia de arista faltante.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full border-separate border-spacing-0.5 font-mono text-sm tabular-nums"><caption className="sr-only">Matriz de costos entre nodos</caption><thead><tr><th scope="col" className="size-9" />{matrix.map((_, index) => <th key={index} scope="col" className="h-9 min-w-9 rounded-md bg-muted text-xs font-semibold">{index + 1}</th>)}</tr></thead><tbody>{matrix.map((row, i) => <tr key={i}><th scope="row" className="size-9 rounded-md bg-muted text-xs font-semibold">{i + 1}</th>{row.map((value, j) => { const key = edgeKey(i + 1, j + 1); const isSuggestion = i !== j && suggested.has(key); const isRoute = i !== j && onRoute.has(key) && !isSuggestion; return <td key={j} className={cn('h-9 min-w-9 rounded-md text-center', i === j && 'bg-muted/60 text-muted-foreground', value === Infinity && 'text-muted-foreground/50', value !== Infinity && i !== j && 'bg-secondary/50 font-medium', isRoute && routeColor, isSuggestion && 'bg-slate-400 text-slate-950 ring-1 ring-inset ring-slate-600 dark:bg-slate-600 dark:text-white dark:ring-slate-400')}>{isSuggestion ? '?' : value === Infinity ? '∞' : value}</td> })}</tr>)}</tbody></table></CardContent></Card>
}
