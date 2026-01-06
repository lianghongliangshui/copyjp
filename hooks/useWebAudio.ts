import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioState } from '../types';

export const useWebAudio = () => {
  // Logic State
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Timing State
  const startTimeRef = useRef<number>(0);     // Context time when playback started
  const startOffsetRef = useRef<number>(0);   // Where in the file we started
  const playDurationRef = useRef<number>(0);  // How long this specific play is
  const animationFrameRef = useRef<number>(0);

  // UI State
  const [state, setState] = useState<AudioState>({
    isReady: false,
    isPlaying: false,
    isLoading: false,
    progress: 0,
    statusMessage: 'Idle',
    duration: 0,
    currentTime: 0,
    volume: 1.0,
  });

  // Initialize Context
  const initContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      
      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
      gain.gain.value = state.volume;
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, [state.volume]);

  // Load Audio Logic
  const loadAudio = useCallback(async (file: File | string) => {
    initContext();
    if (!audioCtxRef.current) return;

    setState(prev => ({ ...prev, isLoading: true, progress: 0, statusMessage: 'Starting...' }));

    try {
      let arrayBuffer: ArrayBuffer;

      // Handle Remote URL with Progress
      if (typeof file === 'string') {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        
        const contentLength = response.headers.get('content-length');
        const total = parseInt(contentLength || '0', 10);
        
        if (response.body && total) {
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let received = 0;
          let lastProgress = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            
            // Throttle progress updates to avoid UI jank
            const progress = Math.min(80, Math.round((received / total) * 80)); 
            if (progress > lastProgress + 5) { // Update every 5%
               lastProgress = progress;
               setState(prev => ({ ...prev, progress, statusMessage: `Downloading ${progress}%` }));
            }
          }

          // Optimized blob reconstruction
          arrayBuffer = await new Blob(chunks).arrayBuffer();
        } else {
          // Fallback for no-stream
          arrayBuffer = await response.arrayBuffer();
        }
      } else {
        // Handle Local File
        setState(prev => ({ ...prev, progress: 50, statusMessage: 'Reading file...' }));
        arrayBuffer = await file.arrayBuffer();
      }

      // Decode Phase
      setState(prev => ({ ...prev, progress: 90, statusMessage: 'Decoding...' }));
      const decodedBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
      audioBufferRef.current = decodedBuffer;

      setState(prev => ({
        ...prev,
        isReady: true,
        isLoading: false,
        progress: 100,
        statusMessage: 'Ready',
        duration: decodedBuffer.duration
      }));

    } catch (error) {
      console.error(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        progress: 0,
        statusMessage: 'Error loading audio'
      }));
    }
  }, [initContext]);

  // Playback Loop
  const updatePlaybackProgress = useCallback(() => {
    if (!audioCtxRef.current || !state.isPlaying) return;

    const ctxTime = audioCtxRef.current.currentTime;
    const elapsed = ctxTime - startTimeRef.current;
    
    // Calculate current position in the file
    let currentFileTime = startOffsetRef.current + elapsed;

    // Check if we exceeded duration of the segment
    if (playDurationRef.current > 0 && elapsed >= playDurationRef.current) {
        stop();
        // Force UI to show end of segment
        currentFileTime = startOffsetRef.current + playDurationRef.current;
    }

    setState(prev => ({ ...prev, currentTime: currentFileTime }));

    if (state.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updatePlaybackProgress);
    }
  }, [state.isPlaying]); // We depend on isPlaying ref implicitly via the loop breaker

  // Start Playing
  const playSegment = useCallback((start: number, end: number) => {
    if (!audioCtxRef.current || !audioBufferRef.current || !gainNodeRef.current) return;

    // Stop existing
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current.disconnect();
    }
    cancelAnimationFrame(animationFrameRef.current);

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(gainNodeRef.current);

    const duration = end - start;
    
    // Web Audio: start(when, offset, duration)
    source.start(0, start, duration);

    sourceNodeRef.current = source;
    startTimeRef.current = audioCtxRef.current.currentTime;
    startOffsetRef.current = start;
    playDurationRef.current = duration;

    setState(prev => ({ ...prev, isPlaying: true, currentTime: start }));

    // Start UI loop
    animationFrameRef.current = requestAnimationFrame(updatePlaybackProgress);

    // Safety cleanup on natural end
    source.onended = () => {
        // We handle logic in updatePlaybackProgress mostly, but this catches edge cases
    };

  }, [updatePlaybackProgress]);

  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    cancelAnimationFrame(animationFrameRef.current);
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const setVolume = useCallback((val: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = val;
    }
    setState(prev => ({ ...prev, volume: val }));
  }, []);

  // Sync state.isPlaying with animation loop
  useEffect(() => {
    if (state.isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updatePlaybackProgress);
    } else {
        cancelAnimationFrame(animationFrameRef.current);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [state.isPlaying, updatePlaybackProgress]);

  return {
    state,
    loadAudio,
    playSegment,
    stop,
    setVolume
  };
};