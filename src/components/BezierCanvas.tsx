import React, { useRef, useEffect, useState } from 'react';
import { Point, bezier } from '../utils/bezier';

const BezierCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (points.length > 1) {
                    drawBezierCurve(ctx, points);
                }
                drawPoints(ctx, points);
            }
        }
    }, [points]);

    const drawBezierCurve = (ctx: CanvasRenderingContext2D, points: Point[]) => {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let t = 0; t <= 1; t += 0.01) {
            const point = bezier(t, points);
            ctx.lineTo(point.x, point.y);
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
        if (isDragging) {
            // 드래깅 중이라면 클릭 이벤트를 무시합니다.
            return;
        }

        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            setPoints([...points, { x, y }]);
        }
    }

    const handleMouseDown = (event: React.MouseEvent) => {
        if (isDragging) {
            // 드래깅 중이라면 클릭 이벤트를 무시합니다.
            return;
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const pointIndex = points.findIndex(point => Math.hypot(point.x - x, point.y - y) < 5);
            if (pointIndex !== -1) {
                setDraggingPointIndex(pointIndex);
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
                const newPoints = points.slice();
                newPoints[draggingPointIndex] = { x, y };
                setPoints(newPoints);
            }
        }
    }

    const handleMouseUp = () => {
        setDraggingPointIndex(null);
        setIsDragging(false);
    }

    const handleMouseLeave = () => {
        setDraggingPointIndex(null);
        setIsDragging(false);
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
