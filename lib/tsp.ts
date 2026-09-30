export type Edge = { u: number; v: number; w: number }

export type Cycle = { route: number[]; cost: number }

export type TspResult = {
  cycles: Cycle[]
  best: Cycle | null
  elapsedMs: number
}

export const MIN_NODES = 5
export const MAX_NODES = 10

export function edgeKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

export function buildMatrix(n: number, edges: Edge[]): number[][] {
  const m = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)),
  )
  for (const { u, v, w } of edges) {
    if (u > n || v > n) continue
    m[u - 1][v - 1] = w
    m[v - 1][u - 1] = w
  }
  return m
}

/**
 * Brute force: fixes node 1 as the start and explores every permutation of the
 * remaining nodes via DFS, pruning missing edges. Reversed duplicates are
 * skipped by requiring route[1] < route[n-1].
 */
export function solveTsp(n: number, edges: Edge[]): TspResult {
  const start = performance.now()
  const m = buildMatrix(n, edges)
  const cycles: Cycle[] = []
  let best: Cycle | null = null

  const path = [0]
  const visited = new Array(n).fill(false)
  visited[0] = true

  const dfs = (cost: number) => {
    const last = path[path.length - 1]
    if (path.length === n) {
      const back = m[last][0]
      if (back === Infinity) return
      if (n > 2 && path[1] > path[n - 1]) return
      const cycle: Cycle = {
        route: [...path, 0].map((i) => i + 1),
        cost: cost + back,
      }
      cycles.push(cycle)
      if (!best || cycle.cost < best.cost) best = cycle
      return
    }
    for (let next = 1; next < n; next++) {
      if (visited[next]) continue
      const w = m[last][next]
      if (w === Infinity) continue
      visited[next] = true
      path.push(next)
      dfs(cost + w)
      path.pop()
      visited[next] = false
    }
  }

  dfs(0)
  return { cycles, best, elapsedMs: performance.now() - start }
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateRandomGraph(
  n: number,
  minW: number,
  maxW: number,
  density = 0.45,
): Edge[] {
  const lo = Math.min(minW, maxW)
  const hi = Math.max(minW, maxW)
  const order = Array.from({ length: n }, (_, i) => i + 1)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }

  const edges: Edge[] = []
  const used = new Set<string>()
  const add = (u: number, v: number) => {
    const key = edgeKey(u, v)
    if (u === v || used.has(key)) return
    used.add(key)
    edges.push({ u: Math.min(u, v), v: Math.max(u, v), w: randInt(lo, hi) })
  }

  for (let i = 0; i < n; i++) add(order[i], order[(i + 1) % n])
  for (let u = 1; u <= n; u++) {
    for (let v = u + 1; v <= n; v++) {
      if (Math.random() < density) add(u, v)
    }
  }
  return edges.sort((a, b) => a.u - b.u || a.v - b.v)
}

export function formatRoute(route: number[]) {
  return route.join(' → ')
}

export const SAMPLE_EDGES: Edge[] = [
  { u: 1, v: 2, w: 7 },
  { u: 1, v: 3, w: 12 },
  { u: 1, v: 6, w: 4 },
  { u: 2, v: 3, w: 5 },
  { u: 2, v: 5, w: 9 },
  { u: 3, v: 4, w: 3 },
  { u: 3, v: 6, w: 11 },
  { u: 4, v: 5, w: 6 },
  { u: 4, v: 6, w: 14 },
  { u: 5, v: 6, w: 8 },
]
