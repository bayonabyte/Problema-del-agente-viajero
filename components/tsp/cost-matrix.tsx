import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { edgeKey } from '@/lib/tsp'

type Props = {
  matrix: number[][]
  highlightedRoute: number[] | null
}

export function CostMatrix({ matrix, highlightedRoute }: Props) {
  const n = matrix.length
  const onRoute = new Set<string>()
  if (highlightedRoute) {
    for (let i = 0; i < highlightedRoute.length - 1; i++) {
      onRoute.add(edgeKey(highlightedRoute[i], highlightedRoute[i + 1]))
    }
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Matriz de Costos</CardTitle>
        <CardDescription>Matriz de adyacencia · ∞ indica ausencia de arista.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0.5 font-mono text-sm tabular-nums">
          <caption className="sr-only">Matriz de costos entre nodos</caption>
          <thead>
            <tr>
              <th scope="col" className="size-9 text-xs text-muted-foreground">
                <span className="sr-only">Origen / destino</span>
              </th>
              {Array.from({ length: n }, (_, j) => (
                <th key={j} scope="col" className="h-9 min-w-9 rounded-md bg-muted text-xs font-semibold">
                  {j + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th scope="row" className="size-9 rounded-md bg-muted text-xs font-semibold">
                  {i + 1}
                </th>
                {row.map((v, j) => {
                  const highlighted = i !== j && onRoute.has(edgeKey(i + 1, j + 1))
                  return (
                    <td
                      key={j}
                      className={cn(
                        'h-9 min-w-9 rounded-md text-center',
                        i === j && 'bg-muted/60 text-muted-foreground',
                        v === Infinity && 'text-muted-foreground/50',
                        v !== Infinity && i !== j && 'bg-secondary/50 font-medium',
                        highlighted && 'bg-route text-white',
                      )}
                    >
                      {v === Infinity ? <span aria-label="infinito">∞</span> : v}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}