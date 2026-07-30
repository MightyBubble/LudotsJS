import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createAbilityPlaygroundScene } from '@/lib/abilityPlaygroundScene';

const AbilityPlaygroundScene = forwardRef(function AbilityPlaygroundScene({ ability, onEvent }, ref) {
  const mountRef = useRef(null);
  const runtimeRef = useRef(null);
  useImperativeHandle(ref, () => ({ cast: () => runtimeRef.current?.cast(), reset: () => runtimeRef.current?.reset() }), []);
  useEffect(() => {
    if (!mountRef.current) return;
    runtimeRef.current = createAbilityPlaygroundScene(mountRef.current, ability, onEvent);
    return () => runtimeRef.current?.dispose();
  }, [ability, onEvent]);
  return <div ref={mountRef} className="h-full min-h-[420px] w-full overflow-hidden rounded border border-[#2A2E37]" />;
});
export default AbilityPlaygroundScene;