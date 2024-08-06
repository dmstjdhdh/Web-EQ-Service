import React from "react";

export const setupAudioNodes = (
    audioContextRef: React.MutableRefObject<AudioContext | null>,
    sourceNodeRef: React.MutableRefObject<MediaElementAudioSourceNode | null>,
    analyserNodeRef: React.MutableRefObject<AnalyserNode | null>,
    filterNodesRef: React.MutableRefObject<BiquadFilterNode[]>,
    audioElementRef: React.MutableRefObject<HTMLAudioElement | null>,
    frequencies: number[]
) => {
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
