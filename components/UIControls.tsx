import React from 'react';
import { Square } from 'lucide-react';

interface UIControlsProps {
  onStop: () => void;
  bloomConfig: {
    intensity: number;
    threshold: number;
    radius: number;
  };
  onUpdateBloom: (key: 'intensity' | 'threshold' | 'radius', value: number) => void;
}

export const UIControls: React.FC<UIControlsProps> = ({ onStop, bloomConfig, onUpdateBloom }) => {
  return (
    <div className="flex flex-col gap-4 bg-black/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10 w-full max-w-2xl shadow-2xl">
      
      {/* Top Bar with Status and Stop */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
          <span className="text-xs uppercase tracking-widest text-green-400 font-bold">Live Signal Active</span>
        </div>
        
        <button
          onClick={onStop}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all text-xs font-bold border border-red-500/20"
        >
          <Square size={12} fill="currentColor" />
          STOP VISUALIZER
        </button>
      </div>
      
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Intensity Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs text-gray-400 font-semibold tracking-wide">
            <span>GLOW INTENSITY</span>
            <span className="text-white font-mono">{bloomConfig.intensity.toFixed(1)}</span>
          </div>
          <input 
            type="range" 
            min="0" max="5" step="0.1"
            value={bloomConfig.intensity}
            onChange={(e) => onUpdateBloom('intensity', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400"
          />
        </div>

        {/* Threshold Slider */}
        <div className="flex flex-col gap-2">
           <div className="flex justify-between text-xs text-gray-400 font-semibold tracking-wide">
            <span>THRESHOLD</span>
            <span className="text-white font-mono">{bloomConfig.threshold.toFixed(2)}</span>
          </div>
          <input 
            type="range" 
            min="0" max="1" step="0.05"
            value={bloomConfig.threshold}
            onChange={(e) => onUpdateBloom('threshold', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-lime-500 hover:accent-lime-400"
          />
        </div>

        {/* Radius Slider */}
        <div className="flex flex-col gap-2">
           <div className="flex justify-between text-xs text-gray-400 font-semibold tracking-wide">
            <span>RADIUS</span>
            <span className="text-white font-mono">{bloomConfig.radius.toFixed(2)}</span>
          </div>
          <input 
            type="range" 
            min="0" max="1.5" step="0.05"
            value={bloomConfig.radius}
            onChange={(e) => onUpdateBloom('radius', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
          />
        </div>
      </div>
    </div>
  );
};