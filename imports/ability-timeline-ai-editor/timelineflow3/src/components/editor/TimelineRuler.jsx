import React from "react";

export default function TimelineRuler({ maxTime, scale }) {
  const intervals = [];
  const step = scale < 0.05 ? 5000 : scale < 0.1 ? 2000 : 1000;

  for (let time = 0; time <= maxTime; time += step) {
    intervals.push(time);
  }

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const remainingMs = ms % 1000;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}.${Math.floor(remainingMs / 100)}s`;
  };

  return (
    <div className="h-8 bg-[#1a1a1a] border-b border-gray-800 relative">
      {intervals.map(time => (
        <div
          key={time}
          className="absolute top-0 h-full border-l border-gray-700"
          style={{ left: time * scale }}
        >
          <span className="absolute top-1 left-1 text-[10px] text-gray-500 font-mono">
            {formatTime(time)}
          </span>
        </div>
      ))}
    </div>
  );
}