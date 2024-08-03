import React, { useRef, useEffect, useState } from 'react';
import { Point, bezier } from '../utils/bezier';

const BezierCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [points, setPoints] = useState<Point[]>([
        { x: 0, y: 300 },
        { x: 800, y: 300 }
    ]);
    const [controlPoints, setControlPoints] = useState<Point[]>([]);
    const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawBezierCurve(ctx, [points[0], ...controlPoints, points[1]]);
                drawPoints(ctx, points);
                drawPoints(ctx, controlPoints);
            }
        }
    }, [points, controlPoints]);

    const drawBezierCurve = (ctx: CanvasRenderingContext2D, points: Point[]) => {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        if (points.length === 2) {
            ctx.lineTo(points[1].x, points[1].y);
        } else {
            for (let t = 0; t <= 1; t += 0.01) {
                const point = bezier(t, points);
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
    }

    const drawPoints = (ctx: CanvasRenderingContext2D, points: Point[]) => {
        points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
        });
    }

    const handleCanvasClick = (event: React.MouseEvent) => {
        if (isDragging) return;

        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;

            const p1 = points[0];
            const p2 = points[1];
            const t = (clickX - p1.x) / (p2.x - p1.x);
            const newPoint = {
                x: clickX,
                y: p1.y + t * (p2.y - p1.y)
            };

            setControlPoints([...controlPoints, newPoint]);
        }
    }

    const handleMouseDown = (event: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const pointIndex = points.findIndex(point => Math.hypot(point.x - x, point.y - y) < 5);
            const controlPointIndex = controlPoints.findIndex(point => Math.hypot(point.x - x, point.y - y) < 5);
            if (pointIndex !== -1 && pointIndex !== 0 && pointIndex !== 1) {
                setDraggingPointIndex(pointIndex);
                setIsDragging(true);
            } else if (controlPointIndex !== -1) {
                setDraggingPointIndex(controlPointIndex + 2);
                setIsDragging(true);
            }
        }
    }

    const handleMouseMove = (event: React.MouseEvent) => {
        if (draggingPointIndex !== null) {
            const canvas = canvasRef.current;
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                if (draggingPointIndex < 2) {
                    const newPoints = points.slice();
                    newPoints[draggingPointIndex] = { x, y };
                    setPoints(newPoints);
                } else {
                    const newControlPoints = controlPoints.slice();
                    newControlPoints[draggingPointIndex - 2] = { x, y };
                    setControlPoints(newControlPoints);
                }
            }
        }
    }

    const handleMouseUp = () => {
        setTimeout(() => {
            setDraggingPointIndex(null);
            setIsDragging(false);
        }, 100);
    }

    const handleMouseLeave = () => {
        setTimeout(() => {
            setDraggingPointIndex(null);
            setIsDragging(false);
        }, 100);
    }

    return (
        <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            width={800}
            height={600}
            style={{ border: '1px solid #000000' }}
        />
    );
}

export default BezierCanvas;
