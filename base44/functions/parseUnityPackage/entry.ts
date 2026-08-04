import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const decode = (bytes) => new TextDecoder().decode(bytes).replace(/\0.*$/, '').trim();
const octal = (bytes) => parseInt(decode(bytes).trim() || '0', 8);
const join = (a, b) => { const out = new Uint8Array(a.length + b.length); out.set(a); out.set(b, a.length); return out; };

async function take(reader, state, length) {
  while (state.buffer.length < length) {
    const next = await reader.read();
    if (next.done) throw new Error('UnityPackage 数据不完整');
    state.buffer = join(state.buffer, next.value);
  }
  const result = state.buffer.slice(0, length);
  state.buffer = state.buffer.slice(length);
  return result;
}

async function skip(reader, state, length) {
  let remaining = length;
  while (remaining > 0) {
    const part = await take(reader, state, Math.min(remaining, 65536));
    remaining -= part.length;
  }
}

function category(path) {
  const ext = path.toLowerCase().split('.').pop();
  if (ext === 'prefab') return 'prefab';
  if (ext === 'mat') return 'material';
  if (['png', 'jpg', 'jpeg', 'tga', 'psd', 'exr', 'hdr'].includes(ext)) return 'texture';
  if (['fbx', 'obj', 'dae'].includes(ext)) return 'model';
  if (['wav', 'mp3', 'ogg', 'aif', 'aiff'].includes(ext)) return 'audio';
  if (['cs', 'shader', 'cginc', 'hlsl'].includes(ext)) return 'script';
  return 'other';
}

async function inspectPackage(stream) {
  const reader = stream.pipeThrough(new DecompressionStream('gzip')).getReader();
  const state = { buffer: new Uint8Array() };
  const entries = new Map();
  while (true) {
    const header = await take(reader, state, 512);
    if (header.every(value => value === 0)) break;
    const name = decode(header.slice(0, 100));
    const size = octal(header.slice(124, 136));
    const padded = Math.ceil(size / 512) * 512;
    const parts = name.split('/');
    const guid = parts[0];
    const leaf = parts[1] || '';
    const record = entries.get(guid) || { guid };
    if (leaf === 'pathname' && size < 65536) {
      record.path = decode(await take(reader, state, size));
      await skip(reader, state, padded - size);
    } else if (leaf === 'asset' && size <= 2097152) {
      const bytes = await take(reader, state, size);
      const prefix = decode(bytes.slice(0, Math.min(bytes.length, 32)));
      if (prefix.startsWith('%YAML')) record.yaml = new TextDecoder().decode(bytes);
      await skip(reader, state, padded - size);
    } else {
      await skip(reader, state, padded);
    }
    entries.set(guid, record);
  }
  const files = [...entries.values()].filter(item => item.path).map(item => {
    const kind = category(item.path);
    const particleSystems = kind === 'prefab' ? (item.yaml?.match(/(?:^|\n)ParticleSystem:/g) || []).length : 0;
    return { path: item.path, category: kind, particleSystems, shuriken: particleSystems > 0 };
  }).sort((a, b) => a.path.localeCompare(b.path));
  const counts = { prefab: 0, material: 0, texture: 0, model: 0, audio: 0, script: 0, other: 0 };
  files.forEach(file => { counts[file.category] += 1; });
  return { total: files.length, particleSystems: files.reduce((sum, file) => sum + file.particleSystems, 0), counts, files: files.slice(0, 1500), truncated: files.length > 1500 };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { fileUrl, fileName } = await req.json();
    if (!fileUrl || !String(fileName || '').toLowerCase().endsWith('.unitypackage')) return Response.json({ error: '请选择 .unitypackage 文件' }, { status: 400 });
    const response = await fetch(fileUrl);
    if (!response.ok || !response.body) throw new Error(`无法读取上传文件 (${response.status})`);
    const manifest = await inspectPackage(response.body);
    return Response.json({ fileName, ...manifest });
  } catch (error) {
    return Response.json({ error: error.message || 'UnityPackage 解析失败' }, { status: 500 });
  }
}