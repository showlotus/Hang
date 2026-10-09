import { POOL_TIER, TIERS } from './constants.js'

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2))

const VALID_TIERS = new Set([...TIERS.map(t => t.key), POOL_TIER])

export function normalizeItems(items) {
  if (!Array.isArray(items)) return []
  return items
    .filter(it => it && it.id && typeof it.name === 'string')
    .map(it => ({
      id: it.id,
      name: it.name,
      note: typeof it.note === 'string' ? it.note : '',
      tier: VALID_TIERS.has(it.tier) ? it.tier : 'rsr',
      src: typeof it.src === 'string' ? it.src : null,
    }))
}

export const tierStyle = t => ({ '--c1': t.c1, '--c2': t.c2, '--tc': t.text })

export async function fileToDataURL(file) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const max = 900
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale)
    const cv = document.createElement('canvas')
    cv.width = w; cv.height = h
    cv.getContext('2d').drawImage(bmp, 0, 0, w, h)
    let out = cv.toDataURL('image/webp', 0.85)
    if (!out.startsWith('data:image/webp')) out = cv.toDataURL('image/jpeg', 0.87)
    bmp.close?.()
    return out
  } catch {
    return new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result)
      r.onerror = rej
      r.readAsDataURL(file)
    })
  }
}

export function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function truncate(ctx, text, maxW) {
  let s = String(text)
  if (ctx.measureText(s).width <= maxW) return s
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1)
  return s + '…'
}

export function drawCover(ctx, img, x, y, w, h, radius) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale, sh = h / scale
  const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2
  ctx.save()
  rr(ctx, x, y, w, h, radius)
  ctx.clip()
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
  ctx.restore()
}

export function hexA(hex, a) {
  return 'rgba(' + [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',') + ',' + a + ')'
}

export function mixHex(h1, h2, r) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
  const a = p(h1), b = p(h2)
  return 'rgb(' + a.map((v, i) => Math.round(v * r + b[i] * (1 - r))).join(',') + ')'
}

export function flipTo(img, rect) {
  const last = img.getBoundingClientRect()
  const dx = (rect.left + rect.width / 2) - (last.left + last.width / 2)
  const dy = (rect.top + rect.height / 2) - (last.top + last.height / 2)
  img.style.transform = `translate(${dx}px, ${dy}px) scale(${rect.width / last.width}, ${rect.height / last.height})`
  img.style.borderRadius = '12px'
}

export const thumbOf = id => {
  const el = document.querySelector(`.card[data-id="${id}"] .card-pic img`)
  return el && el.isConnected ? el : null
}
