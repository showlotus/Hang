import { DB_NAME, DB_VERSION, STORE_KEY } from './constants.js'

const STORE = 'kv'
const STATE_ID = 'state'

let dbPromise = null

function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    dbPromise.catch(() => { dbPromise = null })
  }
  return dbPromise
}

async function idbGet() {
  const db = await openDB()
  return await new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(STATE_ID)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function idbPut(value) {
  const db = await openDB()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, STATE_ID)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function normalize(saved) {
  if (saved && Array.isArray(saved.items)) {
    return {
      items: saved.items.filter(it => it && it.id && typeof it.name === 'string'),
      title: typeof saved.title === 'string' && saved.title ? saved.title : '排行榜',
    }
  }
  return null
}

function readLegacy() {
  try {
    return normalize(JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null'))
  } catch { /* ignore */ }
  return null
}

function clearLegacy() {
  try { localStorage.removeItem(STORE_KEY) } catch { /* ignore */ }
}

export async function loadState() {
  let stored = null
  try { stored = await idbGet() } catch { /* fall back to legacy */ }
  const fromIdb = normalize(stored)
  if (fromIdb) {
    clearLegacy()
    return fromIdb
  }
  const legacy = readLegacy()
  if (legacy) {
    try {
      await idbPut(legacy)
      clearLegacy()
    } catch { /* keep legacy until next attempt */ }
    return legacy
  }
  return { items: [], title: '排行榜' }
}

export async function saveState(state) {
  await idbPut(state)
}
