import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import EntityTemplateList from '@/components/playground/EntityTemplateList';
import PlaygroundToolbar from '@/components/playground/PlaygroundToolbar';
import PlaygroundViewport from '@/components/playground/PlaygroundViewport';

export default function AbilityPlaygroundPage() {
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [paused, setPaused] = useState(false);
  const [clearToken, setClearToken] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    base44.entities.EntityPrototype.list('name', 200).then(setTemplates);
  }, []);

  const onPlace = useCallback((entity) => setPlaced((list) => [...list, entity]), []);
  const onTick = useCallback((t) => setElapsed(t), []);
  const clear = () => { setPlaced([]); setClearToken((t) => t + 1); };

  const template = templates.find((t) => t.id === selectedId) || null;

  return (
    <div className="flex h-full min-h-0 bg-[#0D0F14] text-gray-200">
      <EntityTemplateList templates={templates} selectedId={selectedId} onSelect={setSelectedId} />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <PlaygroundToolbar
          paused={paused}
          onToggle={() => setPaused((p) => !p)}
          onClear={clear}
          count={placed.length}
          elapsed={elapsed}
          templateName={template?.name || template?.prototype_id || ''}
        />
        <PlaygroundViewport
          template={template}
          paused={paused}
          clearToken={clearToken}
          onPlace={onPlace}
          onTick={onTick}
        />
      </div>
    </div>
  );
}