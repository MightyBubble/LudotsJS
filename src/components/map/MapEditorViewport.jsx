import React, { useEffect, useRef } from 'react';
import { createMapEditorScene } from '@/lib/map/mapEditorScene';

export default function MapEditorViewport({ grid, entities, placing, selectedId, onPlace }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const placeRef = useRef(onPlace);
  placeRef.current = onPlace;

  useEffect(() => {
    const scene = createMapEditorScene(mountRef.current, { onPlace: cell => placeRef.current?.(cell) });
    sceneRef.current = scene;
    return () => scene.dispose();
  }, []);

  useEffect(() => { sceneRef.current?.setGrid(grid); sceneRef.current?.setEntities(entities); }, [grid?.width, grid?.height]);
  useEffect(() => { sceneRef.current?.setEntities(entities); }, [entities]);
  useEffect(() => { sceneRef.current?.setPlacing(placing); }, [placing]);
  useEffect(() => { sceneRef.current?.setSelected(selectedId); }, [selectedId]);

  return <div ref={mountRef} className="flex-1 min-h-0 min-w-0" data-testid="map-editor-viewport" />;
}