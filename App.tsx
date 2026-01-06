import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWebAudio } from './hooks/useWebAudio';
import { parseSRT } from './utils/srtParser';
import { SubtitleItem } from './types';
import SubtitleList from './components/SubtitleList';
import Controls from './components/Controls';
import Visualizer from './components/Visualizer';
import { Upload, Info, Music } from 'lucide-react';

const App: React.FC = () => {
  const { state: audioState, loadAudio, playSegment, stop, setVolume } = useWebAudio();
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [dragActive, setDragActive] = useState(false);
  const initRef = useRef(false);

  // Auto-load files on mount (Parallel fetching)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const loadAssets = async () => {
      // 1. Fetch Subtitles independently (Fast)
      fetch('files/subtitles.srt')
        .then(res => {
            if (!res.ok) throw new Error("Failed to load subtitles");
            return res.text();
        })
        .then(text => {
            const parsed = parseSRT(text);
            setSubtitles(parsed);
            if (parsed.length > 0) setActiveIndex(0);
        })
        .catch(e => console.error("Subtitle load error:", e));

      // 2. Fetch Audio independently (Slow, heavy)
      loadAudio('files/audio.mp3');
    };

    loadAssets();
  }, [loadAudio]);

  // -- Playback Logic --
  const playIndex = useCallback((index: number) => {
    if (index < 0 || index >= subtitles.length) return;
    if (!audioState.isReady) {
      // Allow selecting subtitle even if audio isn't ready, but don't play
      setActiveIndex(index);
      return;
    }

    const sub = subtitles[index];
    setActiveIndex(index);
    playSegment(sub.start, sub.end);
  }, [subtitles, audioState.isReady, playSegment]);

  const handleNext = useCallback(() => playIndex(activeIndex + 1), [playIndex, activeIndex]);
  const handlePrev = useCallback(() => playIndex(activeIndex - 1), [playIndex, activeIndex]);
  const handleReplay = useCallback(() => {
    if (activeIndex === -1 && subtitles.length > 0) playIndex(0);
    else playIndex(activeIndex);
  }, [playIndex, activeIndex, subtitles]);

  // -- Keyboard Shortcuts --
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch(e.code) {
        case 'Space':
          e.preventDefault();
          if (audioState.isPlaying) stop();
          else handleReplay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioState.isPlaying, stop, handleReplay, handleNext, handlePrev]);

  // Drag and Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Simple heuristic: check extension
      const files = Array.from(e.dataTransfer.files);
      
      const audioFile = files.find(f => f.type.startsWith('audio/') || f.name.endsWith('.mp3') || f.name.endsWith('.wav'));
      const srtFile = files.find(f => f.name.endsWith('.srt') || f.name.endsWith('.txt'));

      if (audioFile) loadAudio(audioFile);
      if (srtFile) {
        const text = await srtFile.text();
        const parsed = parseSRT(text);
        setSubtitles(parsed);
        if (parsed.length > 0) setActiveIndex(0);
      }
    }
  };
  
  // Calculate duration for visualizer
  const currentDuration = activeIndex >= 0 && subtitles[activeIndex] 
    ? subtitles[activeIndex].end - subtitles[activeIndex].start 
    : 0;
  
  const currentStart = activeIndex >= 0 && subtitles[activeIndex] 
    ? subtitles[activeIndex].start
    : 0;

  return (
    <div 
      className="h-screen w-full flex flex-col bg-gray-100 font-sans text-gray-800"
      onDragEnter={handleDrag}
    >
      {/* Drag Overlay */}
      {dragActive && (
        <div 
          className="absolute inset-0 z-50 bg-blue-500/10 backdrop-blur-sm border-4 border-blue-500 border-dashed m-4 rounded-xl flex items-center justify-center pointer-events-none"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center">
            <Upload size={48} className="mx-auto text-blue-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-700">Drop files here</h3>
            <p className="text-gray-500">Support MP3, WAV, SRT</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full shadow-2xl bg-white sm:rounded-xl sm:my-4 sm:border border-gray-200">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative min-w-0">
          
          <Visualizer 
            audioState={audioState} 
            segmentDuration={currentDuration}
            segmentStart={currentStart}
          />

          <SubtitleList 
            items={subtitles} 
            activeIndex={activeIndex} 
            onSelect={playIndex} 
          />

          <Controls 
            isPlaying={audioState.isPlaying}
            onPlay={handleReplay}
            onStop={stop}
            onNext={handleNext}
            onPrev={handlePrev}
            onVolume={setVolume}
            volume={audioState.volume}
            disabled={!audioState.isReady || subtitles.length === 0}
          />
        </div>

        {/* Info Sidebar */}
        <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 hidden md:flex flex-col gap-6">
          
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
             <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Info size={18} /> Default Session
            </h3>
            <p className="text-sm text-blue-800 mb-2">
              Audio: <span className="font-mono bg-blue-100 px-1 rounded">audio.mp3</span>
            </p>
            <p className="text-sm text-blue-800">
              Subs: <span className="font-mono bg-blue-100 px-1 rounded">subtitles.srt</span>
            </p>
          </div>

          <div className="mt-auto p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-bold text-sm text-gray-800 mb-2 flex items-center gap-2">
               <Music size={16} /> Quick Tips
            </h4>
            <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
              <li>Spacebar to Play/Stop</li>
              <li>Arrow keys to navigate</li>
              <li>Click any line to play segment</li>
              <li>Drag & Drop files to replace</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;