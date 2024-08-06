import { Point } from "../utils/bezier";
import { mapValue } from "../utils/mapvalue";
import {frequencies} from "../constants/frequences";
import React from "react";

export const gaussianFunction = (point: Point, x: number, sigma = 50): number => {
    return (point.y - 300) * Math.exp(-Math.pow(x - point.x, 2) / (2 * Math.pow(sigma, 2))) + 300;
};

export const bezierFunction = (t: number, points: Point[]): Point => {
    const controlPoint = {
        x: 400,
        y: 300 + 8 * (points[1].y - 300)
    };
    const x = (1 - t) * (1 - t) * points[0].x + 2 * (1 - t) * t * controlPoint.x + t * t * points[1].x;
    const y = (1 - t) * (1 - t) * points[0].y + 2 * (1 - t) * t * controlPoint.y + t * t * points[1].y;
    return { x, y };
};

export const drawGaussianCurve = (ctx: CanvasRenderingContext2D, point: Point, gaussianFunction: Function) => {
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.01) {
        const x = t * 800;
        const y = gaussianFunction(point, x);
        if (t === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 2;
    ctx.stroke();
};

export const drawAllGaussianCurves = (ctx: CanvasRenderingContext2D, points: Point[], gaussianFunction: Function) => {
    points.forEach(point => {
        if (point.y !== 300) {
            drawGaussianCurve(ctx, point, gaussianFunction);
        }
    });
};

export const drawAverageGaussianCurve = (ctx: CanvasRenderingContext2D, points: Point[], gaussianFunction: Function, bezierFunction: Function) => {
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.01) {
        const x = t * 800;
        let totalY = 0;
        let count = 0;

        points.forEach(point => {
            if (point.y !== 300) {
                const gaussianY = gaussianFunction(point, x) - 300;
                totalY += gaussianY;
                count++;
            }
        });

        const bezierPoint = bezierFunction(t, [points[0], points[points.length - 1]]);
        if (bezierPoint.y !== 300) {
            totalY += (bezierPoint.y - 300) / 2;
            count++;
        }

        const averageY = 300 + (count > 0 ? totalY / count : 0) * (count > 0 ? count : 1);
        if (t === 0) {
            ctx.moveTo(x, averageY);
        } else {
            ctx.lineTo(x, averageY);
        }
    }
    ctx.strokeStyle = 'magenta';
    ctx.lineWidth = 2;
    ctx.stroke();
};

export const getAverageGaussianY = (x: number, points: Point[], gaussianFunction: Function, bezierFunction: Function): number => {
    let totalY = 0;
    let count = 0;

    points.forEach(point => {
        if (point.y !== 300) {
            const gaussianY = gaussianFunction(point, x) - 300;
            totalY += gaussianY;
            count++;
        }
    });

    const t = x / 800;
    const bezierPoint = bezierFunction(t, [points[0], points[points.length - 1]]);
    if (bezierPoint.y !== 300) {
        totalY += (bezierPoint.y - 300) / 2;
        count++;
    }

    return 300 + (count > 0 ? totalY / count : 0);
};

export const drawBezierCurve = (ctx: CanvasRenderingContext2D, points: Point[], bezierFunction: Function) => {
    if (points.length !== 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x - 800, points[0].y);
    const controlPoint = {
        x: 400,
        y: 300 + 8 * (points[1].y - 300)
    };
    for (let t = 0; t <= 1; t += 0.01) {
        const x = (1 - t) * (1 - t) * (points[0].x - 800) + 2 * (1 - t) * t * (controlPoint.x - 800) + t * t * points[1].x;
        const y = (1 - t) * (1 - t) * points[0].y + 2 * (1 - t) * t * controlPoint.y + t * t * points[1].y;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(points[1].x + 800, points[1].y);
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 2;
    ctx.stroke();
};

export const drawPoint = (ctx: CanvasRenderingContext2D, point: Point, index: number) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.fillText((index + 1).toString(), point.x - 4, point.y + 4);
};

export const drawFrequencyLabels = (ctx: CanvasRenderingContext2D, mapValue: Function) => {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    const positions = [25, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
    const xPositions = positions.map(freq => mapValue(Math.log10(freq), Math.log10(20), Math.log10(20000), 0, 800));
    xPositions.forEach((x, index) => {
        ctx.fillText(`${positions[index]}`, x, 580);
    });
};

export const drawRealTimeFrequencyCurve = (
    ctx: CanvasRenderingContext2D,
    analyserNode: AnalyserNode,
    frequencies: number[],
    canvasWidth: number,
    canvasHeight: number,
    smoothFactor: number
) => {
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(dataArray);

    const minFreq = 20;
    const maxFreq = 20000;

    const curvePoints: Point[] = [];

    frequencies.forEach((freq, index) => {
        const freqStart = frequencies[index];
        const freqEnd = frequencies[index + 1] || maxFreq;
        const tStart = Math.log10(freqStart / minFreq) / Math.log10(maxFreq / minFreq);
        const tEnd = Math.log10(freqEnd / minFreq) / Math.log10(maxFreq / minFreq);
        const xStart = tStart * canvasWidth;
        const xEnd = tEnd * canvasWidth;
        const xMid = (xStart + xEnd) / 2;

        let total = 0;
        let count = 0;

        for (let i = 0; i < bufferLength; i++) {
            const freq = i * (analyserNode.context.sampleRate / 2) / bufferLength;
            if (freq >= freqStart && freq < freqEnd) {
                total += dataArray[i];
                count++;
            }
        }

        const average = count > 0 ? total / count : 0;
        const smoothedY = mapValue(average, 0, 255, canvasHeight, 0) / smoothFactor;

        curvePoints.push({ x: xMid, y: smoothedY });
    });

    // Draw filled curve
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight);
    curvePoints.forEach((point, index) => {
        if (index > 0) {
            const prevPoint = curvePoints[index - 1];
            const midX = (prevPoint.x + point.x) / 2;
            const midY = (prevPoint.y + point.y) / 2;
            ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, midY);
            ctx.quadraticCurveTo(midX, midY, point.x, point.y);
        }
    });
    ctx.lineTo(canvasWidth, canvasHeight);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();

    // Draw curve outline
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight);
    curvePoints.forEach((point, index) => {
        if (index > 0) {
            const prevPoint = curvePoints[index - 1];
            const midX = (prevPoint.x + point.x) / 2;
            const midY = (prevPoint.y + point.y) / 2;
            ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, midY);
            ctx.quadraticCurveTo(midX, midY, point.x, point.y);
        }
    });
    ctx.lineTo(canvasWidth, canvasHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
};

export const draw = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    drawFunctions: {
        drawFrequencyLabels: Function;
        drawAllGaussianCurves: Function;
        drawBezierCurve: Function;
        drawAverageGaussianCurve: Function;
        drawPoint: Function;
        drawRealTimeFrequencyCurve: Function;
    },
    analyserNodeRef: React.MutableRefObject<AnalyserNode | null>
) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (analyserNodeRef.current) {
        drawFunctions.drawRealTimeFrequencyCurve(ctx, analyserNodeRef.current, frequencies, ctx.canvas.width, ctx.canvas.height, 1.2);
    }

    drawFunctions.drawFrequencyLabels(ctx, mapValue);
    drawFunctions.drawAllGaussianCurves(ctx, points, gaussianFunction);
    drawFunctions.drawBezierCurve(ctx, [points[0], points[points.length - 1]], bezierFunction);
    drawFunctions.drawAverageGaussianCurve(ctx, points, gaussianFunction, bezierFunction);
    points.forEach((point, index) => drawFunctions.drawPoint(ctx, point, index));
};
