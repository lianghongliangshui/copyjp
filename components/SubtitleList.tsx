import React, { useEffect, useRef } from 'react';
import { SubtitleItem } from '../types';
import { formatTime } from '../utils/srtParser';

interface SubtitleListProps {
  items: SubtitleItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

const SubtitleList: React.FC<SubtitleListProps> = ({ items, activeIndex, onSelect }) => {
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active item
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      // Calculate position to scroll to roughly center
      const container = containerRef.current;
      const element = activeRef.current;
      
      const elementTop = element.offsetTop;
      const elementHeight = element.clientHeight;
      const containerHeight = container.clientHeight;
      
      container.scrollTo({
        top: elementTop - containerHeight / 2 + elementHeight / 2,
        behavior: 'smooth'
      });
    }
  }, [activeIndex]);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 italic bg-gray-50 h-full">
        No subtitles loaded
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gray-50 border-r border-gray-200"
    >
      <div className="flex flex-col">
        {items.map((item, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={item.id}
              ref={isActive ? activeRef : null}
              onClick={() => onSelect(idx)}
              className={`
                group flex gap-4 p-4 cursor-pointer transition-colors duration-200 border-b border-gray-100
                ${isActive ? 'bg-blue-50 border-l-4 border-l-primary' : 'hover:bg-gray-100 border-l-4 border-l-transparent'}
              `}
            >
              <div className="flex flex-col items-center min-w-[60px] pt-1">
                 <span className={`text-xs font-mono font-medium ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    {formatTime(item.start)}
                 </span>
                 <span className="text-[10px] text-gray-300 group-hover:text-gray-400">
                    #{idx + 1}
                 </span>
              </div>
              <p className={`text-base leading-relaxed ${isActive ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {item.text}
              </p>
            </div>
          );
        })}
      </div>
      {/* Spacer for better scrolling at bottom */}
      <div className="h-32" /> 
    </div>
  );
};

export default SubtitleList;