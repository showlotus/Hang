import { FONT, POOL_TIER, TIERS } from './constants.js'
import { hexA, loadImage, mixHex, rr, truncate } from './utils.js'

const preferMobile = () => typeof matchMedia === 'function' && matchMedia('(max-width: 640px)').matches

export async function buildCanvas(items, title, mode = preferMobile() ? 'mobile' : 'desktop') {
  const M = mode === 'mobile'
  const W = M ? 1080 : 1800, pad = M ? 36 : 48, labelW = M ? 64 : 170, gap = M ? 22 : 14
  const rowPad = M ? 20 : 16, innerGap = M ? 20 : 16, cardGap = M ? 28 : 13, itemsPad = M ? 4 : 3
  const cellW = M ? 273 : 170, cellH = M ? 366 : 228
  const headerH = M ? 120 : 118, footerH = 58
  const maxPer = M ? 3 : Math.max(1, Math.floor((W - pad * 2 - rowPad * 2 - labelW - innerGap - itemsPad * 2 + gap) / (cellW + gap)))
  const ranked = items.filter(i => i.tier !== POOL_TIER)

  const imgs = {}
  await Promise.all(items.filter(i => i.src).map(async i => { imgs[i.id] = await loadImage(i.src) }))

  const rows = TIERS.map(t => items.filter(i => i.tier === t.key))
  const linesOf = r => Math.max(1, Math.ceil(r.length / maxPer))
  const rowHeights = rows.map(r => rowPad * 2 + linesOf(r) * cellH + (linesOf(r) - 1) * cardGap)
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
  ctx.fillText(`从夯到拉 · RANK LIST · 共 ${ranked.length} 项`, pad, pad + (M ? 98 : 88))

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
      const spineY = ly
      const spineH = cellH
      const spineR = 28
      rr(ctx, lx, spineY, labelW, spineH, spineR)
      ctx.save()
      ctx.shadowColor = hexA(t.c1, .45)
      ctx.shadowBlur = 16
      ctx.shadowOffsetY = 6
      const sb = ctx.createLinearGradient(0, spineY, 0, spineY + spineH)
      sb.addColorStop(0, hexA(t.c1, .36))
      sb.addColorStop(1, hexA(t.c2, .28))
      ctx.fillStyle = sb
      ctx.fill()
      ctx.restore()
      rr(ctx, lx, spineY, labelW, spineH, spineR)
      const sl = ctx.createLinearGradient(0, spineY, 0, spineY + spineH)
      sl.addColorStop(0, 'rgba(255,255,255,.42)')
      sl.addColorStop(.48, 'rgba(255,255,255,.08)')
      sl.addColorStop(1, 'rgba(255,255,255,.2)')
      ctx.fillStyle = sl
      ctx.fill()
      rr(ctx, lx + 1, spineY + 1, labelW - 2, spineH - 2, spineR - 1)
      ctx.strokeStyle = 'rgba(255,255,255,.5)'
      ctx.lineWidth = 2
      ctx.stroke()
      const fs = 34, dfs = 21, vGap = 16
      const cx = lx + labelW / 2
      ctx.textAlign = 'center'
      ctx.fillStyle = mixHex(t.c1, '#0f172a', .62)
      const lChars = [...t.label]
      const dChars = [...t.desc]
      const lbh = fs * 1.25, dlh = dfs * 1.2
      if (/[\u4e00-\u9fa5]/.test(t.label)) {
        ctx.font = `800 ${fs}px ${FONT}`
        const contentH = (lChars.length - 1) * lbh + fs + vGap + (dChars.length - 1) * dlh + dfs
        let base = spineY + (spineH - contentH) / 2 + fs * .8
        lChars.forEach((ch, i) => ctx.fillText(ch, cx, base + i * lbh))
        ctx.font = `600 ${dfs}px ${FONT}`
        ctx.globalAlpha = .78
        base += (lChars.length - 1) * lbh + vGap + dfs * .8
        dChars.forEach((ch, i) => ctx.fillText(ch, cx, base + i * dlh))
        ctx.globalAlpha = 1
      } else {
        ctx.font = `800 ${fs}px ${FONT}`
        const sideLen = ctx.measureText(t.label).width
        const descH = (dChars.length - 1) * dlh + dfs
        const gapY = 16
        const top = spineY + (spineH - (sideLen + gapY + descH)) / 2
        ctx.save()
        ctx.translate(cx, top + sideLen / 2)
        ctx.rotate(Math.PI / 2)
        ctx.textBaseline = 'middle'
        ctx.fillText(t.label, 0, 0)
        ctx.restore()
        ctx.font = `600 ${dfs}px ${FONT}`
        ctx.globalAlpha = .78
        let dbase = top + sideLen + gapY + dfs * .8
        dChars.forEach((ch, i) => ctx.fillText(ch, cx, dbase + i * dlh))
        ctx.globalAlpha = 1
      }
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

    const zoneX = lx + labelW + innerGap
    rowItems.forEach((it, i) => {
      const col = i % maxPer, rowLine = Math.floor(i / maxPer)
      const x = zoneX + itemsPad + col * (cellW + cardGap)
      const cy = y + rowPad + rowLine * (cellH + cardGap)

      const cardR = M ? 36 : 24
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
      ctx.moveTo(x, cy + cellW)
      ctx.lineTo(x, cy + cardR)
      ctx.arcTo(x, cy, x + cardR, cy, cardR)
      ctx.lineTo(x + cellW - cardR, cy)
      ctx.arcTo(x + cellW, cy, x + cellW, cy + cardR, cardR)
      ctx.lineTo(x + cellW, cy + cellW)
      ctx.closePath()
      ctx.clip()
      if (imgs[it.id]) {
        const im = imgs[it.id]
        const s = Math.max(cellW / im.width, cellW / im.height)
        const dw = im.width * s, dh = im.height * s
        ctx.drawImage(im, x + (cellW - dw) / 2, cy + (cellW - dh) / 2, dw, dh)
      } else {
        const fg = ctx.createLinearGradient(0, cy, 0, cy + cellW)
        fg.addColorStop(0, hexA(t.c1, .55))
        fg.addColorStop(1, hexA(t.c2, .45))
        ctx.fillStyle = fg
        ctx.fillRect(x, cy, cellW, cellW)
        const hl = ctx.createLinearGradient(0, cy, 0, cy + cellW)
        hl.addColorStop(0, 'rgba(255,255,255,.42)')
        hl.addColorStop(.48, 'rgba(255,255,255,.08)')
        hl.addColorStop(1, 'rgba(255,255,255,.2)')
        ctx.fillStyle = hl
        ctx.fillRect(x, cy, cellW, cellW)
        ctx.fillStyle = mixHex(t.c1, '#0f172a', .62)
        ctx.font = `800 44px ${FONT}`
        ctx.textAlign = 'center'
        ctx.fillText((it.name || '?').trim().charAt(0), x + cellW / 2, cy + cellW / 2 + 16)
      }
      ctx.restore()

      ctx.textAlign = 'center'
      ctx.fillStyle = '#0f172a'
      ctx.font = `700 ${M ? 32 : 16}px ${FONT}`
      ctx.fillText(truncate(ctx, it.name, cellW - (M ? 24 : 16)), x + cellW / 2, cy + cellW + (M ? 40 : 24))
      if (it.note) {
        ctx.fillStyle = '#64748b'
        ctx.font = `500 ${M ? 22 : 14}px ${FONT}`
        ctx.fillText(truncate(ctx, it.note, cellW - (M ? 24 : 16)), x + cellW / 2, cy + cellW + (M ? 84 : 46))
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
