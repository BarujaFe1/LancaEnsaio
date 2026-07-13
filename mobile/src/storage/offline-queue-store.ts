import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  enqueueItem,
  markAttempt,
  removeByKey,
  type QueueItem,
  type QueuedAlerta,
  type QueuedRegistro,
} from '../domain/offline-queue';

const QUEUE_KEY = '@ensaio/offline_queue_v1';

export async function loadQueue(): Promise<QueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueueItem[]) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueueItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueRegistro(item: QueuedRegistro): Promise<QueueItem[]> {
  const queue = enqueueItem(await loadQueue(), item);
  await saveQueue(queue);
  return queue;
}

export async function enqueueAlerta(item: QueuedAlerta): Promise<QueueItem[]> {
  const queue = enqueueItem(await loadQueue(), item);
  await saveQueue(queue);
  return queue;
}

export async function dropFromQueue(key: string): Promise<QueueItem[]> {
  const queue = removeByKey(await loadQueue(), key);
  await saveQueue(queue);
  return queue;
}

export async function bumpAttempt(key: string, error: string): Promise<QueueItem[]> {
  const queue = markAttempt(await loadQueue(), key, error);
  await saveQueue(queue);
  return queue;
}
