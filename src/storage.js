import { DB_NAME, DB_VERSION, STORE_KEY } from './constants.js'
import { normalizeItems, uid } from './utils.js'

const STORE = 'kv'
const STATE_ID = 'state'
const GROUP_PREFIX = 'group:'

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

async function idbEntries() {
  const db = await openDB()
  return await new Promise((resolve, reject) => {
    const out = []
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor()
    req.onsuccess = () => {
      const c = req.result
      if (!c) return resolve(out)
      out.push([c.key, c.value])
      c.continue()
    }
    req.onerror = () => reject(req.error)
  })
}

async function idbPut(key, value) {
  const db = await openDB()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

async function idbDel(key) {
  const db = await openDB()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function normalizeGroup(rec) {
  if (!rec || typeof rec !== 'object' || typeof rec.id !== 'string') return null
  return {
    id: rec.id,
    title: typeof rec.title === 'string' && rec.title.trim() ? rec.title.trim() : '排行榜',
    items: normalizeItems(rec.items),
  }
}

function normalizeV1(saved) {
  if (saved && Array.isArray(saved.items)) {
    return {
      items: normalizeItems(saved.items),
      title: typeof saved.title === 'string' && saved.title ? saved.title : '排行榜',
    }
  }
  return null
}

function readLegacy() {
  try {
    return normalizeV1(JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null'))
  } catch { /* ignore */ }
  return null
}

function clearLegacy() {
  try { localStorage.removeItem(STORE_KEY) } catch { /* ignore */ }
}

function defaultState() {
  const id = uid()
  return { groups: [{ id, title: '排行榜', items: [] }], activeGroupId: id }
}

async function migrateV1(v1) {
  const group = { id: uid(), title: v1.title, items: v1.items }
  try {
    await idbPut(GROUP_PREFIX + group.id, group)
    await idbPut(STATE_ID, { version: 2, activeGroupId: group.id, order: [group.id] })
    clearLegacy()
  } catch { /* keep source until next attempt */ }
  return { groups: [group], activeGroupId: group.id }
}

export async function loadState() {
  let entries = []
  try { entries = await idbEntries() } catch { /* fall back to legacy */ }
  const map = new Map(entries)
  const meta = map.get(STATE_ID)
  if (meta && meta.version === 2 && Array.isArray(meta.order)) {
    const groups = meta.order.map(id => normalizeGroup(map.get(GROUP_PREFIX + id))).filter(Boolean)
    if (groups.length) {
      clearLegacy()
      const active = groups.some(g => g.id === meta.activeGroupId) ? meta.activeGroupId : groups[0].id
      return { groups, activeGroupId: active }
    }
  }
  const fromIdb = normalizeV1(meta)
  if (fromIdb) return migrateV1(fromIdb)
  const legacy = readLegacy()
  if (legacy) return migrateV1(legacy)
  return defaultState()
}

export async function saveMeta({ activeGroupId, order }) {
  await idbPut(STATE_ID, { version: 2, activeGroupId, order })
}

export async function saveGroup(group) {
  await idbPut(GROUP_PREFIX + group.id, group)
}

export async function deleteGroupRecord(id) {
  await idbDel(GROUP_PREFIX + id)
}
