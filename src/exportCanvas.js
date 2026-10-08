import { FONT, TIERS } from './constants.js'
import { drawCover, hexA, loadImage, mixHex, rr, truncate } from './utils.js'

export async function buildCanvas(items, title) {
  const W = 1800, pad = 48, labelW = 170, gap = 14
  const rowPad = 16, innerGap = 16, cardGap = 13, itemsPad = 3
  const cellW = 170, cellH = 197, thumb = 128
  const headerH = 140, footerH = 58
  const availW = W - pad * 2 - rowPad * 2 - labelW - innerGap - itemsPad * 2
  const maxPer = Math.max(1, Math.floor((availW + gap) / (cellW + gap)))

  const imgs = {}
  await Promise.all(items.filter(i => i.src).map(async i => { imgs[i.id] = await loadImage(i.src) }))

  const rows = TIERS.map(t => items.filter(i => i.tier === t.key))
  const linesOf = r => Math.max(1, Math.ceil(r.length / maxPer))
  const rowHeights = rows.map(r => rowPad * 2 + linesOf(r) * cellH + (linesOf(r) - 1) * cardGap + itemsPad * 2)
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
  ctx.font = `800 46px ${FONT}`
  ctx.fillText(title.trim() || '排行榜', pad, pad + 48)
  ctx.fillStyle = '#64748b'
  ctx.font = `500 21px ${FONT}`
  ctx.fillText(`从夯到拉 · RANK LIST · 共 ${items.length} 项`, pad, pad + 88)

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
    const labelH = rowH - rowPad * 2
    rr(ctx, lx, ly, labelW, labelH, 24)
    ctx.save()
    ctx.shadowColor = 'rgba(28,40,92,.12)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetY = 6
    ctx.fillStyle = 'rgba(255,255,255,.38)'
    ctx.fill()
    ctx.restore()
    rr(ctx, lx, ly, labelW, labelH, 24)
    ctx.save()
    ctx.globalAlpha = .3
    const lg = ctx.createLinearGradient(lx, ly, lx + labelW, ly + labelH)
    lg.addColorStop(0, t.c1)
    lg.addColorStop(1, t.c2)
    ctx.fillStyle = lg
    ctx.fill()
    ctx.restore()
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

    const zoneX = lx + labelW + innerGap
    if (!rowItems.length) {
      const sx = zoneX + itemsPad, sy = y + rowPad + itemsPad
      rr(ctx, sx, sy, cellW, cellH, 24)
      ctx.fillStyle = 'rgba(255,255,255,.14)'
      ctx.fill()
      rr(ctx, sx, sy, cellW, cellH, 24)
      ctx.setLineDash([10, 8])
      ctx.strokeStyle = 'rgba(15,23,42,.14)'
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.setLineDash([])
    }
    rowItems.forEach((it, i) => {
      const col = i % maxPer, rowLine = Math.floor(i / maxPer)
      const x = zoneX + itemsPad + col * (cellW + cardGap)
      const cy = y + rowPad + itemsPad + rowLine * (cellH + cardGap)

      rr(ctx, x, cy, cellW, cellH, 24)
      ctx.save()
      ctx.shadowColor = 'rgba(28,40,92,.14)'
      ctx.shadowBlur = 18
      ctx.shadowOffsetY = 8
      const slab = ctx.createLinearGradient(0, cy, 0, cy + cellH)
      slab.addColorStop(0, 'rgba(255,255,255,.74)')
      slab.addColorStop(1, 'rgba(255,255,255,.42)')
      ctx.fillStyle = slab
      ctx.fill()
      ctx.restore()
      rr(ctx, x + 1, cy + 1, cellW - 2, cellH - 2, 23)
      ctx.strokeStyle = 'rgba(255,255,255,.55)'
      ctx.lineWidth = 2
      ctx.stroke()

      const tx = x + (cellW - thumb) / 2
      const ty = cy + 13
      if (imgs[it.id]) {
        drawCover(ctx, imgs[it.id], tx, ty, thumb, thumb, 16)
      } else {
        rr(ctx, tx, ty, thumb, thumb, 16)
        const fg = ctx.createLinearGradient(tx, ty, tx + thumb, ty + thumb)
        fg.addColorStop(0, t.c1)
        fg.addColorStop(1, t.c2)
        ctx.fillStyle = fg
        ctx.fill()
        ctx.fillStyle = mixHex(t.c1, '#0f172a', .62)
        ctx.font = `800 40px ${FONT}`
        ctx.textAlign = 'center'
        ctx.fillText((it.name || '?').trim().charAt(0), tx + thumb / 2, ty + thumb / 2 + 14)
      }

      ctx.textAlign = 'center'
      ctx.fillStyle = '#0f172a'
      ctx.font = `700 16px ${FONT}`
      ctx.fillText(truncate(ctx, it.name, cellW - 16), x + cellW / 2, ty + thumb + 27)
      if (it.note) {
        ctx.fillStyle = '#64748b'
        ctx.font = `500 14px ${FONT}`
        ctx.fillText(truncate(ctx, it.note, cellW - 16), x + cellW / 2, ty + thumb + 49)
      }
    })

    y += rowH + gap
  })

  ctx.fillStyle = '#94a3b8'
  ctx.font = `500 19px ${FONT}`
  ctx.textAlign = 'left'
  ctx.fillText(new Date().toLocaleDateString('zh-CN'), pad, totalH - 26)
  ctx.textAlign = 'right'
  ctx.fillText('夯 ＞ 顶级 ＞ 人上人 ＞ NPC ＞ 拉完了', W - pad, totalH - 26)
  return canvas
}

export async function copyPNG(items, title, toast) {
  if (!items.length) return toast('先添加几个条目吧')
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

export function downloadPNG(items, title, toast) {
  if (!items.length) return toast('先添加几个条目吧')
  buildCanvas(items, title).then(canvas => {
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
  if (!items.length) return toast('先添加几个条目吧')
  const blob = new Blob([JSON.stringify({ title: title.trim(), items }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  const name = (title.trim() || '排行榜') + '.json'
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 3000)
  toast('已下载 ' + name)
}
