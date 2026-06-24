export interface Point {
  x: number;
  y: number;
}

/**
 * Build an SVG polyline `d` string and its total length in a single pass, so the
 * length can seed `strokeDasharray` for a draw-on animation. Iterating with a
 * running `prev` avoids index access entirely (clean under strict TS).
 */
export function buildLine(points: Point[]): { d: string; length: number } {
  let d = '';
  let length = 0;
  let prev: Point | null = null;
  for (const p of points) {
    d += `${prev ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
    if (prev) length += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return { d: d.trim(), length };
}
