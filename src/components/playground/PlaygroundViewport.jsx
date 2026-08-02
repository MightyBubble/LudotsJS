import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createPlaygroundScene } from '@/lib/playground/playgroundScene';

const PlaygroundViewport = forwardRef(function PlaygroundViewport({ map, template, binding, view, paused, clearToken, onPlace, onTick }, ref) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const scene = createPlaygroundScene(mountRef.current, { onPlace, onTick });
    sceneRef.current = scene;
    return () => scene.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { sceneRef.current?.setMap(map || null); }, [map]);
  useEffect(() => { sceneRef.current?.setTemplate(template || null); }, [template]);
  useEffect(() => { sceneRef.current?.setBinding(binding || null); }, [binding]);
  useEffect(() => { sceneRef.current?.setView(view || null); }, [view]);
  useEffect(() => { sceneRef.current?.setPaused(paused); }, [paused]);
  useEffect(() => { if (clearToken) sceneRef.current?.clear(); }, [clearToken]);
  useImperativeHandle(ref, () => ({
    selectByScreenShape: (points, shape) => sceneRef.current?.selectByScreenShape(points, shape) || [],
    selectByWorldShape: (points, shape) => sceneRef.current?.selectByWorldShape(points, shape) || [],
    updateWorldSelection: (points, shape, style) => sceneRef.current?.updateWorldSelection(points, shape, style),
    clearWorldSelection: () => sceneRef.current?.clearWorldSelection(),
  }), []);

  return <div ref={mountRef} className="absolute inset-0" data-testid="playground-viewport" />;
});

export default PlaygroundViewport;