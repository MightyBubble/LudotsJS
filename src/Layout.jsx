import React from "react";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#1e1e1e]">
      <style>{`
        body {
          background: #1e1e1e;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        ::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        
        ::-webkit-scrollbar-track {
          background: #2d2d2d;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #4a4a4a;
          border-radius: 0;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #5a5a5a;
        }
      `}</style>
      {children}
    </div>
  );
}