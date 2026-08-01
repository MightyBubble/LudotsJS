import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createAbilityPlaygroundScene } from '@/lib/abilityPlaygroundScene';

const AbilityPlaygroundScene = forwardRef(function AbilityPlaygroundScene({ ability, onEvent, onSpawn }, ref) {
  const mountRef = useRef(null);
  const runtimeRef = useRef(null);
  useImperativeHandle(ref, () => ({
    cast: () => runtimeRef.current?.cast(), reset: () => runtimeRef.current?.reset(),
    beginPlacement: prototype => runtimeRef.current?.beginPlacement(prototype),
    cancelPlacement: () => runtimeRef.current?.cancelPlacement(), clearPlaced: () => runtimeRef.current?.clearPlaced(),
  }), []);
  useEffect(() => {
    if (!mountRef.current) return;
    runtimeRef.current = createAbilityPlaygroundScene(mountRef.current, ability, onEvent, onSpawn);
    return () => runtimeRef.current?.dispose();
  }, [ability, onEvent, onSpawn]);
  return <div ref={mountRef} className="h-full min-h-0 w-full overflow-hidden border border-border bg-card" />;
});
export default AbilityPlaygroundScene;