// src/utils/bezier.ts
export interface Point {
    x: number;
    y: number;
}

export function bezier(t: number, points: Point[]): Point {
    if (points.length === 1) return points[0];
    const newPoints: Point[] = [];
    for (let i = 0; i < points.length - 1; i++) {
        const x = (1 - t) * points[i].x + t * points[i + 1].x;
        const y = (1 - t) * points[i].y + t * points[i + 1].y;
        newPoints.push({ x, y });
    }
    return bezier(t, newPoints);
}
