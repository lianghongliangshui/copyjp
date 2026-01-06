import { SubtitleItem } from '../types';

export const parseSRT = (data: string): SubtitleItem[] => {
  const normalizedData = data.replace(/\r/g, '');
  const pattern = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g;
  const items: SubtitleItem[] = [];
  
  // Normalize blocks
  const blocks = normalizedData.split('\n\n');
  
  let idCounter = 0;

  blocks.forEach(block => {
    const lines = block.split('\n');
    if (lines.length >= 2) {
      // Try to find the timestamp line (it contains '-->')
      const timeLineIndex = lines.findIndex(l => l.includes('-->'));
      
      if (timeLineIndex !== -1) {
        const times = lines[timeLineIndex].split(' --> ');
        if (times.length === 2) {
          const start = parseTime(times[0]);
          const end = parseTime(times[1]);
          // Text is everything after the timestamp line
          const text = lines.slice(timeLineIndex + 1).join('\n').trim();
          
          if (text) {
            items.push({ 
              id: idCounter++, 
              start, 
              end, 
              text 
            });
          }
        }
      }
    }
  });

  return items;
};

const parseTime = (t: string): number => {
  try {
    const [hms, ms] = t.split(',');
    const parts = hms.split(':');
    
    if (parts.length !== 3) return 0;

    const [h, m, s] = parts.map(Number);
    return (h * 3600) + (m * 60) + s + (parseInt(ms || '0') / 1000);
  } catch (e) {
    return 0;
  }
};

export const formatTime = (seconds: number): string => {
  if (!isFinite(seconds)) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  // Optional: Add MS if needed, but usually MM:SS is cleaner for UI
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};