import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const KEY = 'gem_logs_v1';
const MAX = 800;

function safeJson(obj) {
  try { return JSON.stringify(obj); } catch { return String(obj); }
}

async function readAll() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function writeAll(list) {
  const trimmed = list.slice(-MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed;
}

export async function getLogs() {
  return readAll();
}

export async function clearLogs() {
  await AsyncStorage.removeItem(KEY);
}

export async function logEvent(level, message, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    meta: meta ?? null
  };

  // Terminal (Metro) — aparece no VSCode
  const line = `[${entry.ts}] [${level}] ${message} ${meta ? safeJson(meta) : ''}`;
  if (level === 'ERROR') console.error(line);
  else if (level === 'WARN') console.warn(line);
  else console.log(line);

  const list = await readAll();
  list.push(entry);
  await writeAll(list);
}

export async function logInfo(message, meta) {
  return logEvent('INFO', message, meta);
}

export async function logWarn(message, meta) {
  return logEvent('WARN', message, meta);
}

export async function logError(message, error, meta) {
  const payload = {
    ...(meta || {}),
    errorMessage: error?.message || String(error),
    errorStack: error?.stack || null
  };
  return logEvent('ERROR', message, payload);
}

export async function exportLogsTxt() {
  const logs = await readAll();
  const content = logs.map(l => `${l.ts} [${l.level}] ${l.message} ${l.meta ? safeJson(l.meta) : ''}`).join('\n');
  const uri = `${FileSystem.cacheDirectory}gem-logs.txt`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) await Sharing.shareAsync(uri, { mimeType: 'text/plain' });
  return uri;
}