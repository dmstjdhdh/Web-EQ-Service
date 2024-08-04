import React, { useEffect, useRef, useState } from 'react';
import { bezier, Point } from '../utils/bezier';

const frequencies = [
    25, 31, 40, 50, 63, 80, 100, 125, 160, 200,
    250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000,
    2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000
];

const mapValue = (value: number, inputMin: number, inputMax: number, outputMin: number, outputMax: number): number => {
    return ((value - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) + outputMin;
};

const BezierCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const filterNodesRef = useRef<BiquadFilterNode[]>([]);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
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
        updateFilterGains();
    }, [points, controlPoints]);

    const setupAudioNodes = () => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const audioElement = audioElementRef.current!;
        const sourceNode = audioContext.createMediaElementSource(audioElement as HTMLMediaElement);
        sourceNodeRef.current = sourceNode;

        const inputNode = audioContext.createGain();
        sourceNode.connect(inputNode);

        filterNodesRef.current = frequencies.map((frequency, index, array) => {
            const filterNode = audioContext.createBiquadFilter();
            filterNode.gain.value = 0;
            filterNode.frequency.setValueAtTime(frequency, audioContext.currentTime);

            if (index === 0) {
                filterNode.type = 'lowshelf';
            } else if (index === array.length - 1) {
                filterNode.type = 'highshelf';
            } else {
                filterNode.type = 'peaking';
            }
            return filterNode;
        });

        filterNodesRef.current.reduce((prev, current) => {
            prev.connect(current);
            return current;
        }, inputNode);

        const outputNode = audioContext.createGain();
        filterNodesRef.current[filterNodesRef.current.length - 1].connect(outputNode);
        outputNode.connect(audioContext.destination);

        sourceNode.connect(filterNodesRef.current[0]);
    }

    const updateFilterGains = () => {
        const controlPointsWithEndpoints = [points[0], ...controlPoints, points[1]];
        filterNodesRef.current.forEach((filter, index) => {
            const t = index / (filterNodesRef.current.length - 1);
            const point = bezier(t, controlPointsWithEndpoints);
            const frequency = mapValue(point.x, 0, 800, 20, 20000);
            filter.frequency.value = frequency;
            const gain = (300 - point.y) / 10;
            filter.gain.value = Math.max(-40, Math.min(40, gain)); // Limit gain to -40dB to 40dB
        });
    };

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
            if (pointIndex !== -1) {
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
        <div>
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
            <audio id="my-audio" controls ref={audioElementRef}></audio>
            <input type="file" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && audioElementRef.current) {
                    if ("src" in audioElementRef.current) {
                        audioElementRef.current.src = URL.createObjectURL(file);
                    }
                    if ("load" in audioElementRef.current) {
                        audioElementRef.current.load();
                    }
                    setupAudioNodes();
                }
            }} />
        </div>
    );
}

export default BezierCanvas;
