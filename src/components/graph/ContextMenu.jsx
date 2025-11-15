import React from 'react';

export default function ContextMenu({ x, y, options, onSelect, onClose }) {
  React.useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div
      className="fixed bg-[#252526] border border-[#3e3e42] rounded shadow-2xl z-50 py-1 min-w-[160px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => {
            onSelect(option.value);
            onClose();
          }}
          className="w-full px-3 py-2 text-left text-white/80 hover:bg-[#2a2d2e] flex items-center gap-2 text-sm"
        >
          {option.icon && <option.icon className="w-4 h-4" />}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}