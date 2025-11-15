import React from 'react';
import { Activity } from 'lucide-react';

export default function SimulationPanel({ results }) {
  const resultArray = Object.values(results);

  if (resultArray.length === 0) {
    return null;
  }

  const formatValue = (value, type) => {
    if (!value && value !== 0) return 'null';
    
    if (type === 'output_number') {
      return typeof value === 'number' ? value.toFixed(3) : value;
    }
    
    if (type === 'output_vector2' && value && value.x !== undefined) {
      return `(${value.x.toFixed(2)}, ${value.y.toFixed(2)})`;
    }
    
    if (type === 'output_vector3' && value && value.x !== undefined) {
      return `(${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)})`;
    }
    
    if (type === 'output_vector4' && value && value.x !== undefined) {
      return `(${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)}, ${value.w.toFixed(2)})`;
    }
    
    if (type === 'output_color' && value && value.r !== undefined) {
      const r = Math.round(value.r * 255);
      const g = Math.round(value.g * 255);
      const b = Math.round(value.b * 255);
      return (
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded border border-white/20" 
            style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
          />
          <span>rgb({r}, {g}, {b})</span>
        </div>
      );
    }
    
    return JSON.stringify(value);
  };

  return (
    <div className="w-80 bg-[#252526] border-l border-[#3e3e42] flex flex-col">
      <div className="p-3 border-b border-[#3e3e42] flex items-center gap-2">
        <Activity className="w-4 h-4 text-green-400" />
        <h2 className="text-white font-medium text-sm">输出结果</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {resultArray.map((result) => (
          <div 
            key={result.nodeId}
            className="bg-[#1e1e1e] rounded p-3 border border-[#3e3e42]"
          >
            <div className="text-white/90 text-sm font-medium mb-1">
              {result.label || result.type.replace('output_', '')}
            </div>
            <div className="text-white text-sm font-mono">
              {formatValue(result.value, result.type)}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e1e1e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3e3e42;
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4e4e52;
        }
      `}</style>
    </div>
  );
}