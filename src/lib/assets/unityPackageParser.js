const text = bytes => new TextDecoder().decode(bytes).replace(/\0.*$/, '').trim();
const octal = bytes => parseInt(text(bytes).trim() || '0', 8);
const merge = (a, b) => { const value = new Uint8Array(a.length + b.length); value.set(a); value.set(b, a.length); return value; };

async function take(reader, state, length) {
  while (state.buffer.length < length) {
    const next = await reader.read();
    if (next.done) throw new Error('UnityPackage 数据不完整');
    state.buffer = merge(state.buffer, next.value);
  }
  const result = state.buffer.slice(0, length);
  state.buffer = state.buffer.slice(length);
  return result;
}

async function skip(reader, state, length) {
  let remaining = length;
  while (remaining > 0) {
    const count = Math.min(remaining, 262144);
    await take(reader, state, count);
    remaining -= count;
  }
}

function classify(path) {
  const extension = path.toLowerCase().split('.').pop();
  if (extension === 'prefab') return 'prefab';
  if (extension === 'mat') return 'material';
  if (['png', 'jpg', 'jpeg', 'tga', 'psd', 'exr', 'hdr'].includes(extension)) return 'texture';
  if (['fbx', 'obj', 'dae'].includes(extension)) return 'model';
  if (['wav', 'mp3', 'ogg', 'aif', 'aiff'].includes(extension)) return 'audio';
  if (['cs', 'shader', 'cginc', 'hlsl'].includes(extension)) return 'script';
  return 'other';
}

export async function parseUnityPackage(file, onProgress = () => {}) {
  let loaded = 0;
  const measured = file.stream().pipeThrough(new TransformStream({ transform(chunk, controller) {
    loaded += chunk.byteLength;
    onProgress(Math.min(75, Math.round((loaded / file.size) * 75)));
    controller.enqueue(chunk);
  }}));
  const reader = measured.pipeThrough(new DecompressionStream('gzip')).getReader();
  const state = { buffer: new Uint8Array() };
  const entries = new Map();
  while (true) {
    const header = await take(reader, state, 512);
    if (header.every(value => value === 0)) break;
    const name = text(header.slice(0, 100));
    const size = octal(header.slice(124, 136));
    const padded = Math.ceil(size / 512) * 512;
    const [guid, leaf = ''] = name.split('/');
    const record = entries.get(guid) || { guid };
    if (leaf === 'pathname' && size < 65536) {
      record.path = text(await take(reader, state, size));
      await skip(reader, state, padded - size);
    } else if (leaf === 'asset' && size <= 2097152) {
      const bytes = await take(reader, state, size);
      if (text(bytes.slice(0, 32)).startsWith('%YAML')) record.yaml = new TextDecoder().decode(bytes);
      await skip(reader, state, padded - size);
    } else await skip(reader, state, padded);
    entries.set(guid, record);
  }
  onProgress(90);
  const files = [...entries.values()].filter(item => item.path).map(item => {
    const category = classify(item.path);
    const particleSystems = category === 'prefab' ? (item.yaml?.match(/(?:^|\n)ParticleSystem:/g) || []).length : 0;
    return { path: item.path, category, particleSystems, shuriken: particleSystems > 0 };
  }).sort((a, b) => a.path.localeCompare(b.path));
  const counts = { prefab: 0, material: 0, texture: 0, model: 0, audio: 0, script: 0, other: 0 };
  files.forEach(item => { counts[item.category] += 1; });
  return { fileName: file.name, fileSize: file.size, total: files.length, particleSystems: files.reduce((sum, item) => sum + item.particleSystems, 0), counts, files: files.slice(0, 1500), truncated: files.length > 1500 };
}