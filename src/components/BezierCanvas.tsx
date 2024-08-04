import React, { useEffect, useRef, useState } from 'react';
import { defaultPoints } from "../constants/defaultPoints";
import { mapValue } from "../function/mapValue";
import { frequencies } from "../constants/frequences";
import { bezier, Point } from "../utils/bezier";

const BezierCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const filterNodesRef = useRef<BiquadFilterNode[]>([]);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const [points, setPoints] = useState<Point[]>(defaultPoints);
    const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);

    useEffect(() => {
        setupCanvas();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                draw(ctx);
            }
        }
        updateFilterGains();
    }, [points]);

    const setupCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                draw(ctx);
            }
        }
    };

    const setupAudioNodes = () => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const audioElement = audioElementRef.current!;
        const sourceNode = audioContext.createMediaElementSource(audioElement as HTMLMediaElement);
        sourceNodeRef.current = sourceNode;

        const analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 2048;
        analyserNodeRef.current = analyserNode;

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
        outputNode.connect(analyserNode);
        analyserNode.connect(audioContext.destination);

        sourceNode.connect(filterNodesRef.current[0]);
    };

    const updateFilterGains = () => {
        const controlPointsWithEndpoints = points;
        filterNodesRef.current.forEach((filter, index) => {
            const t = index / (filterNodesRef.current.length - 1);
            const point = bezier(t, controlPointsWithEndpoints);
            const frequency = mapValue(point.x, 0, 800, 20, 20000);
            filter.frequency.value = frequency;
            const gain = (300 - point.y) / 10;
            filter.gain.value = Math.max(-10, Math.min(10, gain));
        });
    };

    const drawBezierCurve = (ctx: CanvasRenderingContext2D, points: Point[]) => {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let t = 0; t <= 1; t += 0.01) {
            const point = bezier(t, points);
            ctx.lineTo(point.x, point.y);
        }
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    const drawPoints = (ctx: CanvasRenderingContext2D, points: Point[]) => {
        points.forEach((point, index) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.fillText((index + 1).toString(), point.x - 4, point.y + 4);
        });
    };

    const drawFrequencyLabels = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        const positions = [25, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
        const xPositions = positions.map(freq => mapValue(Math.log10(freq), Math.log10(20), Math.log10(20000), 0, 800));
        xPositions.forEach((x, index) => {
            ctx.fillText(`${positions[index]}`, x, 580);
        });
    };

    const drawFrequencyData = (ctx: CanvasRenderingContext2D) => {
        if (!analyserNodeRef.current) return;

        const bufferLength = analyserNodeRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNodeRef.current.getByteFrequencyData(dataArray);

        const barWidth = (ctx.canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 256) * ctx.canvas.height;
            ctx.fillStyle = 'rgba(0, 128, 0, 0.6)';
            ctx.fillRect(x, ctx.canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        drawFrequencyData(ctx);
        drawFrequencyLabels(ctx);
        drawBezierCurve(ctx, points);
        drawPoints(ctx, points);
        requestAnimationFrame(() => draw(ctx));
    };

    const handleMouseDown = (event: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const pointIndex = points.findIndex(point => Math.hypot(point.x - x, point.y - y) < 10);
            if (pointIndex !== -1) {
                setDraggingPointIndex(pointIndex);
            }
        }
    };

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
    };

    const handleMouseUp = () => {
        setTimeout(() => {
            setDraggingPointIndex(null);
        }, 100);
    };

    const handleMouseLeave = () => {
        setTimeout(() => {
            setDraggingPointIndex(null);
        }, 100);
    };

    const handleAudioPlay = () => {
        if (!audioContextRef.current) {
            setupAudioNodes();
        }
        audioElementRef.current?.play();
    };

    return (
        <div style={{ backgroundColor: '#282c34', padding: '20px', borderRadius: '10px', width: '860px', margin: '0 auto', color: 'white' }}>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                width={800}
                height={600}
                style={{ border: '1px solid #61dafb', borderRadius: '10px', backgroundColor: '#1e1e1e' }}
            />
            <audio id="my-audio" controls ref={audioElementRef} onPlay={handleAudioPlay} style={{ width: '100%', marginTop: '10px', borderRadius: '5px' }}></audio>
            <input
                type="file"
                onChange={(e) => {
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
                }}
                style={{
                    display: 'block',
                    margin: '10px auto',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    backgroundColor: '#61dafb',
                    color: 'black',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'center'
                }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '800px', margin: '20px auto 0' }}>
                {frequencies.map(freq => (
                    <span key={freq} style={{ color: 'white' }}>{freq}</span>
                ))}
            </div>
        </div>
    );
};

export default BezierCanvas;
