import React from 'react';
import { Play, Square, SkipBack, SkipForward, Volume2 } from 'lucide-react';

interface ControlsProps {
  onPlay: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolume: (val: number) => void;
  volume: number;
  isPlaying: boolean;
  disabled: boolean;
}

const Controls: React.FC<ControlsProps> = ({ 
  onPlay, onStop, onNext, onPrev, onVolume, volume, isPlaying, disabled 
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full p-4 bg-white border-t border-gray-200">
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onPrev}
          disabled={disabled}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 text-gray-700 transition"
          title="Previous (Left Arrow)"
        >
          <SkipBack size={24} />
        </button>

        {!isPlaying ? (
          <button 
            onClick={onPlay}
            disabled={disabled}
            className="p-3 rounded-full bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:bg-gray-300 text-white shadow-lg transition transform hover:scale-105"
            title="Play Segment (Space)"
          >
            <Play size={28} fill="currentColor" />
          </button>
        ) : (
          <button 
            onClick={onStop}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition transform hover:scale-105"
            title="Stop (Space)"
          >
            <Square size={28} fill="currentColor" />
          </button>
        )}

        <button 
          onClick={onNext}
          disabled={disabled}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 text-gray-700 transition"
          title="Next (Right Arrow)"
        >
          <SkipForward size={24} />
        </button>
      </div>

      <div className="flex-1 w-full sm:w-auto"></div>

      {/* Volume */}
      <div className="flex items-center gap-3 min-w-[150px]">
        <Volume2 size={20} className="text-gray-500" />
        <input 
          type="range" 
          min="0" 
          max="1.5" 
          step="0.05"
          value={volume}
          onChange={(e) => onVolume(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
};

export default Controls;