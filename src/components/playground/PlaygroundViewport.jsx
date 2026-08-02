import React, { useEffect, useRef } from 'react';
import { createPlaygroundScene } from '@/lib/playground/playgroundScene';

export default function PlaygroundViewport({ map, template, binding, view, paused, clearToken, onPlace, onTick }) {
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

  return <div ref={mountRef} className="flex-1 min-h-0 min-w-0" data-testid="playground-viewport" />;
}