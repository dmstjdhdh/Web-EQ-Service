import React, { useEffect, useRef, useState } from 'react';
import { frequencies } from "../constants/frequences";
import { setupAudioNodes } from "../audio/audioNode";
import {
    draw,
    drawFrequencyLabels,
    drawAllGaussianCurves,
    drawBezierCurve,
    drawAverageGaussianCurve,
    drawPoint,
    getAverageGaussianY,
    gaussianFunction,
    bezierFunction,
    drawRealTimeFrequencyCurve
} from "../draw/drawFuncitons";
import { Point } from "../utils/bezier";
import { defaultPoints } from "../constants/defaultPoints";

const EqualizerCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const filterNodesRef = useRef<BiquadFilterNode[]>([]);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const initialPoints: Point[] = defaultPoints;
    const [points, setPoints] = useState<Point[]>(initialPoints);
    const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);

    useEffect(() => {
        setupCanvas();
    }, []);

    useEffect(() => {
        const animate = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    draw(ctx, points, { drawFrequencyLabels, drawAllGaussianCurves, drawBezierCurve, drawAverageGaussianCurve, drawPoint, drawRealTimeFrequencyCurve }, analyserNodeRef);
                }
            }
            requestAnimationFrame(animate);
        };
        animate();
    }, [points]);

    const setupCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                draw(ctx, points, { drawFrequencyLabels, drawAllGaussianCurves, drawBezierCurve, drawAverageGaussianCurve, drawPoint, drawRealTimeFrequencyCurve }, analyserNodeRef);
            }
        }
    };

    const updateFilterGains = () => {
        const minFreq = 20;
        const maxFreq = 20000;

        filterNodesRef.current.forEach((filter, index) => {
            const freqStart = frequencies[index];
            const freqEnd = frequencies[index + 1] || maxFreq;
            const tStart = Math.log10(freqStart / minFreq) / Math.log10(maxFreq / minFreq);
            const tEnd = Math.log10(freqEnd / minFreq) / Math.log10(maxFreq / minFreq);
            const xStart = tStart * 800;
            const xEnd = tEnd * 800;

            let totalY = 0;
            let count = 0;

            for (let x = xStart; x <= xEnd; x += 1) {
                const averageY = getAverageGaussianY(x, points, gaussianFunction, bezierFunction);
                totalY += averageY;
                count++;
            }

            const averageY = count > 0 ? totalY / count : 300;

            const frequency = frequencies[index];
            filter.frequency.value = frequency;
            const gain = (300 - averageY) / 10;
            filter.gain.value = Math.max(-10, Math.min(10, gain));
        });
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
                updateFilterGains();
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
            setupAudioNodes(audioContextRef, sourceNodeRef, analyserNodeRef, filterNodesRef, audioElementRef, frequencies);
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
                        setupAudioNodes(audioContextRef, sourceNodeRef, analyserNodeRef, filterNodesRef, audioElementRef, frequencies);
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

export default EqualizerCanvas;
