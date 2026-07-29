import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function NavGroup({ icon: Icon, label, active, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${active ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#2A2E37] hover:text-white"}`}
      >
        <Icon className="w-3.5 h-3.5" />{label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 min-w-[140px] bg-[#15171C] border border-[#2A2E37] rounded shadow-xl py-1"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}