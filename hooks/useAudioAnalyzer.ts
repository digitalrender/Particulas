import { useEffect, useRef, useState } from 'react';

export interface AudioData {
  frequency: Uint8Array;
  average: number;
  low: number;   // Bass
  mid: number;   // Mids
  high: number;  // Treble
}

export const useAudioAnalyzer = (stream: MediaStream | null) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  // Initialize Audio Context
  useEffect(() => {
    if (!stream) {
      // Cleanup if stream is removed
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    
    // FFT Size determines frequency resolution. 
    // 1024 = 512 frequency bins.
    analyser.fftSize = 1024; 
    analyser.smoothingTimeConstant = 0.8; // Smooths out the visualization

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;
    sourceRef.current = source;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    return () => {
      source.disconnect();
      analyser.disconnect();
      audioCtx.close();
    };
  }, [stream]);

  const getAudioData = (): AudioData => {
    if (!analyserRef.current || !dataArrayRef.current) {
      return { frequency: new Uint8Array(0), average: 0, low: 0, mid: 0, high: 0 };
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    const data = dataArrayRef.current;
    const length = data.length;

    // Calculate bands (rough approximation)
    let sum = 0;
    let lowSum = 0;
    let midSum = 0;
    let highSum = 0;

    const lowBound = Math.floor(length * 0.1); // Bottom 10%
    const midBound = Math.floor(length * 0.5); // Next 40%

    for (let i = 0; i < length; i++) {
      const val = data[i];
      sum += val;
      if (i < lowBound) lowSum += val;
      else if (i < midBound) midSum += val;
      else highSum += val;
    }

    return {
      frequency: data,
      average: sum / length,
      low: lowSum / lowBound,
      mid: midSum / (midBound - lowBound),
      high: highSum / (length - midBound)
    };
  };

  return { getAudioData };
};