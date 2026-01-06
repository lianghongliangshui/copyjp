import React from 'react';
import { AudioState } from '../types';
import { formatTime } from '../utils/srtParser';

interface VisualizerProps {
  audioState: AudioState;
  segmentDuration: number;
  segmentStart: number;
}

const Visualizer: React.FC<VisualizerProps> = ({ audioState, segmentDuration, segmentStart }) => {
  const { currentTime, isPlaying } = audioState;
  
  // Calculate relative progress for the current segment
  const elapsed = currentTime - segmentStart;
  const percentage = segmentDuration > 0 
    ? Math.min(100, Math.max(0, (elapsed / segmentDuration) * 100))
    : 0;

  return (
    <div className="w-full bg-white p-6 border-b border-gray-200 shadow-sm flex flex-col gap-4">
      {/* Time & Status */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">SonicScript</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${audioState.isReady ? 'bg-green-500' : 'bg-orange-400 animate-pulse'}`}></span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {audioState.statusMessage}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-light text-primary tabular-nums">
            {formatTime(currentTime)}
          </div>
          <div className="text-xs text-gray-400">Current Position</div>
        </div>
      </div>

      {/* Progress Bar (Segment Based) */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden w-full">
        {/* Total Track context (optional background) */}
        <div 
           className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-[50ms] ease-linear"
           style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Loading Overlay */}
      {audioState.isLoading && (
        <div className="mt-2 text-xs text-blue-600 font-medium animate-pulse">
           {/* If needed, a second bar for download progress */}
           <div className="w-full bg-gray-200 h-1 rounded-full mt-1">
             <div className="h-full bg-blue-400 rounded-full transition-all duration-300" style={{ width: `${audioState.progress}%` }}></div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Visualizer;