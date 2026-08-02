import React from 'react';
import { Section, NumberField, TextField } from '@/components/ludots/ui';

export default function MapCameraEditor({ camera, onChange }) {
  const value = camera || { virtual_camera_id: '', target_x_cm: null, target_y_cm: null, yaw: null, pitch: null, distance_cm: null, fov_y_deg: null };
  const patch = next => onChange({ ...value, ...next });
  return <Section title="Default Camera">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><TextField helpIndex={28} label="Virtual Camera ID" value={value.virtual_camera_id} onChange={virtual_camera_id => patch({ virtual_camera_id })} /><NumberField helpIndex={29} label="Target X (cm)" value={value.target_x_cm} onChange={target_x_cm => patch({ target_x_cm })} /><NumberField helpIndex={29} label="Target Y (cm)" value={value.target_y_cm} onChange={target_y_cm => patch({ target_y_cm })} /><NumberField helpIndex={30} label="Yaw" value={value.yaw} onChange={yaw => patch({ yaw })} /><NumberField helpIndex={30} label="Pitch" value={value.pitch} onChange={pitch => patch({ pitch })} /><NumberField helpIndex={31} label="Distance (cm)" value={value.distance_cm} onChange={distance_cm => patch({ distance_cm })} /><NumberField helpIndex={32} label="FOV Y" value={value.fov_y_deg} onChange={fov_y_deg => patch({ fov_y_deg })} /></div>
  </Section>;
}