// In-memory + localStorage-backed store simulating a backend history table.
// This is the ONLY place that knows how "persistence" currently works — when
// the real FastAPI backend exists, services/api.js swaps this module out for
// real HTTP calls without any page/component changes.
import { MOCK_ANALYSES } from '../data/mockData.js';

const STORAGE_KEY = 'visionai_history_v1';

let memoryStore = null;

function readFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeToStorage(analyses) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
  } catch {
    // Storage unavailable or quota exceeded (private browsing, large images) —
    // the session continues to work against the in-memory copy only.
  }
}

function getStore() {
  if (memoryStore) return memoryStore;
  const stored = readFromStorage();
  memoryStore = stored && stored.length ? stored : MOCK_ANALYSES.map((a) => ({ ...a }));
  if (!stored) writeToStorage(memoryStore);
  return memoryStore;
}

export function listAnalyses() {
  return [...getStore()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function findAnalysis(id) {
  return getStore().find((a) => a.id === id) || null;
}

export function addAnalysis(analysis) {
  const store = getStore();
  store.unshift(analysis);
  writeToStorage(store);
  return analysis;
}

export function removeAnalysis(id) {
  const store = getStore();
  const index = store.findIndex((a) => a.id === id);
  if (index !== -1) store.splice(index, 1);
  writeToStorage(store);
}

export function pickRandomTemplate() {
  return MOCK_ANALYSES[Math.floor(Math.random() * MOCK_ANALYSES.length)];
}
