import React, { useState, useRef, useEffect } from "react";

export default function Connection({ 
  connectionId,
  fromPos, 
  toPos, 
  controlPoints,
  isSelected = false, 
  isDragging = false, 
  onSelect, 
  onUpdate,
  onDoubleClick, 
  isExecution = false,
  scale = 1
}) {
  if (!fromPos || !toPos) return null;
  
  // Local state for dragging handles
  const [draggingHandle, setDraggingHandle] = useState(null); // 'cp1' or 'cp2'
  const svgRef = useRef(null);

  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  
  // Calculate default Control Points if not provided
  let cp1, cp2;

  if (controlPoints) {
    // Use stored relative offsets
    cp1 = { x: fromPos.x + controlPoints.cp1.x, y: fromPos.y + controlPoints.cp1.y };
    cp2 = { x: toPos.x + controlPoints.cp2.x, y: toPos.y + controlPoints.cp2.y };
  } else {
    // Default calculation
    if (isExecution) {
       // Default Horizontal Tangents logic for Execution
       const dist = Math.max(Math.abs(dx) * 0.5, 50);
       cp1 = { x: fromPos.x + dist, y: fromPos.y };
       cp2 = { x: toPos.x - dist, y: toPos.y };
    } else {
       // Default Vertical Tangents logic for Data (or adapt based on node/socket direction if we knew it)
       // Assuming data pins are mostly top/bottom or vertical heavy?
       // Actually, the user wants "Normal Bezier" for execution. Standard node editors usually use Horizontal Tangents (Left/Right).
       
       // For data:
       const vDist = Math.max(Math.abs(dy) * 0.5, 30);
       cp1 = { x: fromPos.x, y: fromPos.y + vDist };
       cp2 = { x: toPos.x, y: toPos.y - vDist };
    }
  }

  // FORCE BEZIER for everything as requested
  const pathData = `M ${fromPos.x} ${fromPos.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${toPos.x} ${toPos.y}`;

  const handleDragStart = (e, handleName) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingHandle(handleName);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingHandle) return;

      // We need mouse position relative to SVG canvas
      // We can't easily get SVG ref from here as it's in parent.
      // But we can use e.movementX/Y if we just want delta.
      // Or better, use clientX/Y and convert if we had context.
      // Let's use global mouse coordinates and assume 1:1 scale or handle scale externally? 
      // Wait, NodeEditor has scale. We are inside transformed div? 
      // NO, NodeEditor renders connections in an SVG that is absolute 0,0 but inside a transformed div?
      // Let's check NodeEditor.
      // The SVG is inside `transformRef` div which has `scale`.
      // So `e.movementX / scale` gives delta.
      
      // We don't have access to `scale` prop here.
      // We need to pass `scale` from NodeEditor or use a different approach.
      // Let's assume for now simple delta works if scale is 1, but it will be wrong if zoomed.
      // Actually, simpler: We calculate new Control Point based on mouse pos.
      
      // Let's use `onUpdate` with Delta.
      // But we need the current values.
      
      // Workaround: We can't easily implement drag here without context of scale/offset.
      // Let's assume we receive `onHandleDrag(handleName, deltaX, deltaY)` from parent?
      // No, standard is to handle it here.
      
      // Let's try using `movementX` and assume we can get scale from a context or just pass it.
      // Passed props: `scale` (we should add this to NodeEditor passing props)
    };

    const handleMouseUp = () => {
      setDraggingHandle(null);
    };

    if (draggingHandle) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingHandle]);

  // Redoing drag logic to be simpler and robust:
  // Use a global handler in this component that calculates delta based on initial click.
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialCPPos = useRef({ x: 0, y: 0 });

  const onHandleMouseDown = (e, handleName) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingHandle(handleName);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialCPPos.current = handleName === 'cp1' ? { ...cp1 } : { ...cp2 };
  };

  const handleGlobalMouseMove = (e) => {
    if (!draggingHandle) return;
    
    // We need to know the scale to apply correct delta.
    // Since we don't have scale, we can try to deduce it or ask user to pass it.
    // Let's grab the closest parent with style transform scale?
    // Or just ask NodeEditor to pass it.
    // Better: NodeEditor passes `scale`.
    // I will add `scale` to props.
    
    const dx = (e.clientX - dragStartPos.current.x) / scale;
    const dy = (e.clientY - dragStartPos.current.y) / scale;

    const newPos = {
      x: initialCPPos.current.x + dx,
      y: initialCPPos.current.y + dy
    };

    // Convert to relative offset
    let newControlPoints = controlPoints ? { ...controlPoints } : {
        // Initialize if starting from default
        cp1: { x: cp1.x - fromPos.x, y: cp1.y - fromPos.y },
        cp2: { x: cp2.x - toPos.x, y: cp2.y - toPos.y }
    };

    if (draggingHandle === 'cp1') {
        newControlPoints.cp1 = { x: newPos.x - fromPos.x, y: newPos.y - fromPos.y };
    } else {
        newControlPoints.cp2 = { x: newPos.x - toPos.x, y: newPos.y - toPos.y };
    }

    onUpdate(connectionId, { controlPoints: newControlPoints });
  };

  const strokeColor = isDragging ? "#fbbf24" : isSelected ? "#06b6d4" : "#6b7280";
  const strokeWidth = isSelected ? 3 : 2;

  return (
    <>
      {/* Wide hit area */}
      {!isDragging && (
        <path
          d={pathData}
          fill="none"
          stroke="transparent"
          strokeWidth="20"
          style={{ 
            pointerEvents: 'stroke',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onDoubleClick?.(connectionId, { x: e.clientX, y: e.clientY });
          }}
        />
      )}
      
      {/* Glow */}
      {(isSelected || isDragging) && (
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="12"
          opacity="0.2"
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />
      )}
      
      {/* Main Path */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={isDragging ? 0.8 : 0.6}
        strokeLinecap="round"
        strokeDasharray={isDragging ? "8,4" : "none"}
        style={{ pointerEvents: 'none' }}
      >
        {isDragging && (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="24"
            dur="0.8s"
            repeatCount="indefinite"
          />
        )}
      </path>

      {/* Control Points Handles (Only when selected) */}
      {isSelected && !isDragging && (
        <>
          {/* Handle Lines */}
          <path d={`M ${fromPos.x} ${fromPos.y} L ${cp1.x} ${cp1.y}`} stroke="#06b6d4" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
          <path d={`M ${toPos.x} ${toPos.y} L ${cp2.x} ${cp2.y}`} stroke="#06b6d4" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />

          {/* Handle Circles */}
          <circle 
            cx={cp1.x} cy={cp1.y} r="6" 
            fill="#0b0d12" stroke="#06b6d4" strokeWidth="2" 
            style={{ cursor: 'move', pointerEvents: 'all' }}
            onMouseDown={(e) => onHandleMouseDown(e, 'cp1')}
          />
           <circle 
            cx={cp2.x} cy={cp2.y} r="6" 
            fill="#0b0d12" stroke="#06b6d4" strokeWidth="2" 
            style={{ cursor: 'move', pointerEvents: 'all' }}
            onMouseDown={(e) => onHandleMouseDown(e, 'cp2')}
          />
        </>
      )}
    </>
  );
}