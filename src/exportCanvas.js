import { FONT, POOL_TIER, TIERS } from './constants.js'
import { hexA, loadImage, mixHex, rr, truncate } from './utils.js'

const preferMobile = () => typeof matchMedia === 'function' && matchMedia('(max-width: 640px)').matches

export async function buildCanvas(items, title, mode = preferMobile() ? 'mobile' : 'desktop') {
  const M = mode === 'mobile'
  const W = M ? 1080 : 1800, pad = M ? 36 : 48, labelW = M ? 0 : 170, gap = M ? 22 : 14
  const rowPad = M ? 30 : 16, innerGap = M ? 20 : 16, cardGap = M ? 30 : 13, itemsPad = M ? 0 : 3
  const labelH = 88, rowGap = 21, picRatio = 4.25 / 4.75, nameH = 42, cardBottom = 18
  const headerH = M ? 120 : 118, footerH = 58
  const innerW = W - pad * 2 - rowPad * 2
  const maxPer = M
    ? Math.max(1, Math.floor((innerW + cardGap) / (200 + cardGap)))
    : Math.max(1, Math.floor((W - pad * 2 - rowPad * 2 - labelW - innerGap - itemsPad * 2 + gap) / (170 + gap)))
  const cellW = M ? (innerW - (maxPer - 1) * cardGap) / maxPer : 170
  const cellH = M ? Math.round(cellW * picRatio + nameH + cardBottom) : 228
  const ranked = items.filter(i => i.tier !== POOL_TIER)

  const imgs = {}
  await Promise.all(items.filter(i => i.src).map(async i => { imgs[i.id] = await loadImage(i.src) }))

  const rows = TIERS.map(t => items.filter(i => i.tier === t.key))
  const linesOf = r => Math.max(1, Math.ceil(r.length / maxPer))
  const rowHeights = rows.map(r => {
    const lines = linesOf(r)
    return rowPad * 2 + (M ? labelH + rowGap : 0) + lines * cellH + (lines - 1) * cardGap
  })
  const totalH = Math.round(pad + headerH + rowHeights.reduce((a, b) => a + b, 0) + (rowHeights.length - 1) * gap + footerH)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = totalH
  const ctx = canvas.getContext('2d')

  const bg = ctx.createLinearGradient(0, 0, 0, totalH)
  bg.addColorStop(0, '#eef2f9')
  bg.addColorStop(1, '#e3e9f3')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, totalH)

  const blob = (cx, cy, r, rgb, a) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, `rgba(${rgb},${a})`)
    g.addColorStop(.55, `rgba(${rgb},${a * .45})`)
    g.addColorStop(1, `rgba(${rgb},0)`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, totalH)
  }
  blob(-W * .1, -totalH * .14, W * .3, '96,165,250', .5)
  blob(W * 1.12, -totalH * .08, W * .26, '251,146,60', .38)
  blob(W * .5, totalH * 1.06, totalH * .32, '167,139,250', .45)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#0f172a'
  ctx.font = `800 ${M ? 52 : 46}px ${FONT}`
  ctx.fillText(title.trim() || '排行榜', pad, pad + (M ? 54 : 48))
  ctx.fillStyle = '#64748b'
  ctx.font = `500 ${M ? 26 : 21}px ${FONT}`
  ctx.fillText(`从夯到拉 · 共 ${ranked.length} 项`, pad, pad + (M ? 98 : 88))

  let y = pad + headerH
  rows.forEach((rowItems, idx) => {
    const t = TIERS[idx]
    const rowH = rowHeights[idx]
    const rowW = W - pad * 2

    rr(ctx, pad, y, rowW, rowH, 24)
    ctx.save()
    ctx.shadowColor = 'rgba(28,40,92,.1)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetY = 5
    const rowTint = ctx.createLinearGradient(0, y, 0, y + rowH)
    rowTint.addColorStop(0, hexA(t.c1, .16))
    rowTint.addColorStop(1, hexA(t.c2, .12))
    ctx.fillStyle = rowTint
    ctx.fill()
    ctx.restore()
    rr(ctx, pad, y, rowW, rowH, 24)
    ctx.fillStyle = 'rgba(255,255,255,.18)'
    ctx.fill()
    rr(ctx, pad + 1, y + 1, rowW - 2, rowH - 2, 23)
    ctx.strokeStyle = 'rgba(255,255,255,.34)'
    ctx.lineWidth = 2
    ctx.stroke()

    const lx = pad + rowPad
    const ly = y + rowPad
    if (M) {
      const px = pad + rowPad, py = y + rowPad
      const pw = W - pad * 2 - rowPad * 2, ph = labelH, pr = ph / 2
      rr(ctx, px, py, pw, ph, pr)
      ctx.save()
      ctx.shadowColor = hexA(t.c1, .45)
      ctx.shadowBlur = 16
      ctx.shadowOffsetY = 6
      const pb = ctx.createLinearGradient(0, py, 0, py + ph)
      pb.addColorStop(0, hexA(t.c1, .36))
      pb.addColorStop(1, hexA(t.c2, .28))
      ctx.fillStyle = pb
      ctx.fill()
      ctx.restore()
      rr(ctx, px, py, pw, ph, pr)
      const pl = ctx.createLinearGradient(0, py, 0, py + ph)
      pl.addColorStop(0, 'rgba(255,255,255,.42)')
      pl.addColorStop(.48, 'rgba(255,255,255,.08)')
      pl.addColorStop(1, 'rgba(255,255,255,.2)')
      ctx.fillStyle = pl
      ctx.fill()
      rr(ctx, px + 1, py + 1, pw - 2, ph - 2, pr - 1)
      ctx.strokeStyle = 'rgba(255,255,255,.5)'
      ctx.lineWidth = 2
      ctx.stroke()

      const lfs = 42, sfs = 24, dfs = 33
      const midY = py + ph / 2
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.font = `800 ${lfs}px ${FONT}`
      const lw = ctx.measureText(t.label).width
      ctx.font = `500 ${sfs}px ${FONT}`
      const sw = ctx.measureText('   ·   ').width
      ctx.font = `400 ${dfs}px ${FONT}`
      const dw = ctx.measureText(t.desc).width
      let tx = px + (pw - lw - sw - dw) / 2
      ctx.fillStyle = mixHex(t.c1, '#0f172a', .62)
      ctx.font = `800 ${lfs}px ${FONT}`
      ctx.fillText(t.label, tx, midY)
      tx += lw
      ctx.globalAlpha = .55
      ctx.font = `500 ${sfs}px ${FONT}`
      ctx.fillText('   ·   ', tx, midY + 2)
      tx += sw
      ctx.globalAlpha = .78
      ctx.font = `400 ${dfs}px ${FONT}`
      ctx.fillText(t.desc, tx, midY)
      ctx.globalAlpha = 1
      ctx.textBaseline = 'alphabetic'
    } else {
      const labelH = Math.min(rowH - rowPad * 2, cellH)
      rr(ctx, lx, ly, labelW, labelH, 24)
      ctx.save()
      ctx.shadowColor = hexA(t.c1, .45)
      ctx.shadowBlur = 16
      ctx.shadowOffsetY = 6
      const lb = ctx.createLinearGradient(0, ly, 0, ly + labelH)
      lb.addColorStop(0, hexA(t.c1, .36))
      lb.addColorStop(1, hexA(t.c2, .28))
      ctx.fillStyle = lb
      ctx.fill()
      ctx.restore()
      const lh = ctx.createLinearGradient(0, ly, 0, ly + labelH)
      lh.addColorStop(0, 'rgba(255,255,255,.42)')
      lh.addColorStop(.48, 'rgba(255,255,255,.08)')
      lh.addColorStop(1, 'rgba(255,255,255,.2)')
      ctx.fillStyle = lh
      ctx.fill()
      rr(ctx, lx + 1, ly + 1, labelW - 2, labelH - 2, 23)
      ctx.strokeStyle = 'rgba(255,255,255,.5)'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.textAlign = 'center'
      ctx.fillStyle = mixHex(t.c1, '#0f172a', .62)
      ctx.font = `800 31px ${FONT}`
      ctx.fillText(t.label, lx + labelW / 2, ly + labelH / 2 - 2)
      ctx.font = `600 15px ${FONT}`
      ctx.globalAlpha = .78
      ctx.fillText(t.desc, lx + labelW / 2, ly + labelH / 2 + 26)
      ctx.globalAlpha = 1
    }

    const zoneX = M ? pad + rowPad : lx + labelW + innerGap
    rowItems.forEach((it, i) => {
      const col = i % maxPer, rowLine = Math.floor(i / maxPer)
      const x = zoneX + itemsPad + col * (cellW + cardGap)
      const cy = y + rowPad + (M ? labelH + rowGap : 0) + rowLine * (cellH + cardGap)
      const picH = M ? Math.round(cellW * picRatio) : cellW
      const cardR = M ? 32 : 24

      rr(ctx, x, cy, cellW, cellH, cardR)
      ctx.save()
      ctx.shadowColor = hexA(t.c1, .45)
      ctx.shadowBlur = 16
      ctx.shadowOffsetY = 6
      const slab = ctx.createLinearGradient(0, cy, 0, cy + cellH)
      slab.addColorStop(0, 'rgba(255,255,255,.74)')
      slab.addColorStop(1, 'rgba(255,255,255,.42)')
      ctx.fillStyle = slab
      ctx.fill()
      ctx.restore()
      rr(ctx, x + 1, cy + 1, cellW - 2, cellH - 2, cardR - 1)
      ctx.strokeStyle = 'rgba(255,255,255,.55)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.beginPath()
      if (M) {
        ctx.moveTo(x, cy + picH)
        ctx.lineTo(x, cy + cardR)
        ctx.arcTo(x, cy, x + cardR, cy, cardR)
        ctx.lineTo(x + cellW - cardR, cy)
        ctx.arcTo(x + cellW, cy, x + cellW, cy + cardR, cardR)
        ctx.lineTo(x + cellW, cy + picH)
      } else {
        ctx.moveTo(x, cy + cellW)
        ctx.lineTo(x, cy + cardR)
        ctx.arcTo(x, cy, x + cardR, cy, cardR)
        ctx.lineTo(x + cellW - cardR, cy)
        ctx.arcTo(x + cellW, cy, x + cellW, cy + cardR, cardR)
        ctx.lineTo(x + cellW, cy + cellW)
      }
      ctx.closePath()
      ctx.clip()
      if (imgs[it.id]) {
        const im = imgs[it.id]
        const s = Math.max(cellW / im.width, picH / im.height)
        const dw = im.width * s, dh = im.height * s
        ctx.drawImage(im, x + (cellW - dw) / 2, cy + (picH - dh) / 2, dw, dh)
      } else {
        const fg = ctx.createLinearGradient(0, cy, 0, cy + picH)
        fg.addColorStop(0, hexA(t.c1, .55))
        fg.addColorStop(1, hexA(t.c2, .45))
        ctx.fillStyle = fg
        ctx.fillRect(x, cy, cellW, picH)
        const hl = ctx.createLinearGradient(0, cy, 0, cy + picH)
        hl.addColorStop(0, 'rgba(255,255,255,.42)')
        hl.addColorStop(.48, 'rgba(255,255,255,.08)')
        hl.addColorStop(1, 'rgba(255,255,255,.2)')
        ctx.fillStyle = hl
        ctx.fillRect(x, cy, cellW, picH)
        ctx.fillStyle = mixHex(t.c1, '#0f172a', .62)
        ctx.font = `800 ${M ? 52 : 44}px ${FONT}`
        ctx.textAlign = 'center'
        ctx.fillText((it.name || '?').trim().charAt(0), x + cellW / 2, cy + picH / 2 + (M ? 18 : 16))
      }
      ctx.restore()

      ctx.textAlign = 'center'
      ctx.fillStyle = '#0f172a'
      if (M) {
        ctx.font = `700 28px ${FONT}`
        ctx.textBaseline = 'middle'
        ctx.fillText(truncate(ctx, it.name, cellW - 24), x + cellW / 2, cy + picH + (cellH - picH) / 2)
        ctx.textBaseline = 'alphabetic'
      } else {
        ctx.font = `700 16px ${FONT}`
        ctx.fillText(truncate(ctx, it.name, cellW - 16), x + cellW / 2, cy + cellW + 24)
        if (it.note) {
          ctx.fillStyle = '#64748b'
          ctx.font = `500 14px ${FONT}`
          ctx.fillText(truncate(ctx, it.note, cellW - 16), x + cellW / 2, cy + cellW + 46)
        }
      }
    })

    y += rowH + gap
  })

  ctx.fillStyle = '#94a3b8'
  ctx.font = `500 19px ${FONT}`
  ctx.textAlign = 'left'
  ctx.fillText('夯 ＞ 顶级 ＞ 人上人 ＞ NPC ＞ 拉完了', pad, totalH - 26)
  ctx.textAlign = 'right'
  ctx.fillText(new Date().toLocaleDateString('zh-CN'), W - pad, totalH - 26)
  return canvas
}

export async function copyPNG(items, title, toast) {
  if (!items.some(i => i.tier !== POOL_TIER)) return toast('先添加几个项目吧')
  try {
    const canvas = await buildCanvas(items, title)
    const item = new ClipboardItem({ 'image/png': new Promise(res => canvas.toBlob(res, 'image/png')) })
    await navigator.clipboard.write([item])
    toast('已复制到剪贴板，可直接粘贴')
  } catch {
    toast('剪贴板不可用，已改为下载 PNG')
    downloadPNG(items, title, toast)
  }
}

export function downloadPNG(items, title, toast, mode) {
  if (!items.some(i => i.tier !== POOL_TIER)) return toast('先添加几个项目吧')
  buildCanvas(items, title, mode).then(canvas => {
    canvas.toBlob(blob => {
      const a = document.createElement('a')
      const name = (title.trim() || '排行榜') + '.png'
      a.href = URL.createObjectURL(blob)
      a.download = name
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 3000)
      toast('已下载 ' + name)
    }, 'image/png')
  })
}

export function downloadJSON(items, title, toast) {
  if (!items.length) return toast('先添加几个项目吧')
  const blob = new Blob([JSON.stringify({ title: title.trim(), items }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  const name = (title.trim() || '排行榜') + '.json'
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 3000)
  toast('已下载 ' + name)
}
