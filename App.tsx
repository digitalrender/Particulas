import React, { useState, Suspense, useCallback } from 'react';
import { VisualizerScene } from './components/VisualizerScene';
import { UIControls } from './components/UIControls';
import { Mic, Music, AlertCircle } from 'lucide-react';

const YOUTUBE_LINK = "https://www.youtube.com/watch?v=uMcyZ6CbZ1U";

export default function App() {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bloom Effect State
  const [bloomConfig, setBloomConfig] = useState({
    intensity: 1.5,
    threshold: 0.6,
    radius: 0.6
  });

  const updateBloom = (key: 'intensity' | 'threshold' | 'radius', value: number) => {
    setBloomConfig(prev => ({ ...prev, [key]: value }));
  };

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setIsListening(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied. Please allow permission to visualize audio.");
    }
  }, []);

  const stopListening = useCallback(() => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
      setIsListening(false);
    }
  }, [audioStream]);

  const openSong = () => {
    window.open(YOUTUBE_LINK, '_blank');
  };

  return (
    <div className="relative w-full h-full bg-black text-white overflow-hidden">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading 3D Engine...</div>}>
          <VisualizerScene 
            audioStream={audioStream} 
            isListening={isListening} 
            bloomConfig={bloomConfig}
          />
        </Suspense>
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header */}
        <header className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter text-white drop-shadow-lg">
              MIDNIGHT PULSE
            </h1>
            <p className="text-gray-400 text-sm mt-1 drop-shadow-md">Interactive Cube Grid System</p>
          </div>
          
          <button 
            onClick={openSong}
            className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 border border-white/20 rounded-full transition-all text-sm backdrop-blur-md group"
          >
            <Music size={16} className="text-green-400 group-hover:text-white transition-colors" />
            <span>Open M83 - Midnight City</span>
          </button>
        </header>

        {/* Center Prompt (if not listening) */}
        {!isListening && !error && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto max-w-md w-full">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
              <Mic size={48} className="mx-auto text-green-400 mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold mb-2">Ready to Visualize</h2>
              <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                This experience uses your microphone to react to system audio. 
                <br />
                <span className="text-green-400">1. Open the song in a new tab.</span>
                <br />
                <span className="text-lime-400">2. Click Start below.</span>
              </p>
              <button
                onClick={startListening}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-500 hover:to-lime-500 rounded-lg font-bold shadow-lg shadow-green-900/20 transition-all transform hover:scale-105"
              >
                Start Visualization
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto">
             <div className="bg-red-900/60 backdrop-blur-xl border border-red-500/30 p-8 rounded-2xl">
              <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
              <p className="text-red-200 mb-4">{error}</p>
              <button
                onClick={startListening}
                className="px-6 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Controls Footer */}
        <div className="pointer-events-auto w-full flex justify-center">
          {isListening && (
            <UIControls 
              onStop={stopListening} 
              bloomConfig={bloomConfig}
              onUpdateBloom={updateBloom}
            />
          )}
        </div>
      </div>
    </div>
  );
}