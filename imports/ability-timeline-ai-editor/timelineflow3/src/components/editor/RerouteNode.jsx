import React, { useRef, useEffect } from "react";

export default function RerouteNode({ 
  node,
  isSelected, 
  onSelect, 
  onDrag, 
  onPinMouseDown,
  onPinPositionsUpdate,
  onDragStart,
  onDragEnd,
  onDelete, // Allow deleting
  scale
}) {
  const nodeRef = useRef(null);
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  
  // Reroute nodes are small, so we track pin positions closely
  useEffect(() => {
    if (!nodeRef.current) return;
    
    const updatePinPositions = () => {
        // For a reroute node, the "pin" is basically the center of the node
        // But to handle directions correctly, we can define "input" as left/center and "output" as right/center
        // Or just use the center for both if it's omni-directional visually
        
        // Let's use the DOM elements for precision
        const rect = nodeRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const positions = {
            'input-input': { x: centerX, y: centerY },
            'output-output': { x: centerX, y: centerY }
        };
        onPinPositionsUpdate?.(node.id, positions);
    };

    updatePinPositions();
  }, [node.position, node.id, onPinPositionsUpdate, scale]);

  const handleMouseDown = (e) => {
      e.stopPropagation();
      onSelect();
      // Initiate drag directly on the node
      onDragStart?.();
      
      const startX = e.clientX;
      const startY = e.clientY;
      const initialX = node.position.x;
      const initialY = node.position.y;

      const handleMouseMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        onDrag(node.id, deltaX, deltaY, initialX, initialY);
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        onDragEnd?.();
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
  };
  
  // Double click to delete? Or use keyboard
  
  return (
    <div
      ref={nodeRef}
      className={`absolute w-4 h-4 rounded-full flex items-center justify-center cursor-move z-30
        ${isSelected ? 'bg-white ring-2 ring-amber-500' : 'bg-gray-400 hover:bg-white'}
        transition-colors
      `}
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: 'translate(-50%, -50%)' // Center anchor
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
          e.stopPropagation();
          // Optional: Delete on double click? Or just select
      }}
    >
      {/* Invisible Hit Areas for Pins */}
      {/* We overlay them on the node so dragging the node works, 
          but we need to distinguish dragging the node vs creating a connection.
          Reroute nodes are tricky: usually dragging the body moves it, 
          but dragging from it creates connection.
          
          Let's say:
          - Alt+Drag or Shift+Drag to move?
          - Or Center is move, Outer ring is connect? 
          - Standard behavior: Dragging the node moves it. 
          - To connect: You usually have to drag from a specific area or it's just move.
          
          Actually, for Reroute nodes, often you drag 'through' them or they just exist.
          If I want to continue the line, I drag from it.
          
          Let's make the node itself the drag handle for moving.
          To connect FROM it, maybe hold a modifier key?
          Or we add small hidden handles on Left/Right?
       */}
       
       {/* Input Pin (Left side, invisible but interactive?) */}
       <div 
         ref={inputRef}
         className="absolute left-0 top-0 w-full h-full rounded-full"
         style={{ zIndex: 10 }}
         onMouseDown={(e) => {
             if (e.ctrlKey || e.metaKey) {
                 // Allow dragging the node if Ctrl is held
                 return; 
             }
             // If standard click, we might interpret as move
             // To Create Connection: Maybe use a small visible ring?
             // Or let's just treat the whole thing as a pin if Modifier is held?
             
             // Let's stick to: Click+Drag = Move Node.
             // To connect, we probably need a dedicated small area or modifier.
             // Let's use Shift+Drag to connect?
             
             if (e.shiftKey) {
                e.stopPropagation();
                onPinMouseDown(e, node.id, 'output', true, false); // Treat as output for new connection
             }
         }}
       />
       
       {/* Visual Dot */}
       <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-500' : 'bg-gray-600'}`} />
       
       {/* Tooltip/Label if needed */}
    </div>
  );
}