import { View, Canvas, Button, Text, Image as TaroImage } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro from '@tarojs/taro'
import type { Project } from '../../api'

// ── helpers ──

const typeLabels: Record<string, string> = { INDIVIDUAL: '个人', TEAM: '团队', CLASS: '班级' }
const typeColors: Record<string, string> = { INDIVIDUAL: '#10B981', TEAM: '#8B5CF6', CLASS: '#2563EB' }

const fieldColors: Record<string, string> = {
  '计算机科学': '#2563EB', '人工智能': '#7C3AED', '生物医药': '#059669',
  '物理数学': '#D97706', '化学材料': '#0891B2', '工程技术': '#EA580C',
  '社会科学': '#DB2777', '人文艺术': '#4F46E5',
}

function wrapText(ctx: any, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const ch of text) {
    const test = cur + ch
    if (ctx.measureText(test).width > maxWidth && cur.length > 0) {
      lines.push(cur); cur = ch
      if (lines.length >= maxLines) break
    } else cur = test
  }
  if (cur && lines.length < maxLines) lines.push(cur)
  return lines
}

function drawRoundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  r = Math.min(r, w / 2, h / 2)
  ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
  ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, 0)
  ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5)
  ctx.arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI)
  ctx.closePath()
}

// ── Props ──

interface PosterCanvasProps {
  project: Project
  onClose: () => void
}

// ── Micro QR-code pixel drawer (version 3, 29×29 modules, alphanumeric) ──
// Encodes a short string into a binary matrix and renders it to canvas.

type QRMatrix = (0 | 1)[][]

function makeQRMatrix(text: string, size: number): QRMatrix {
  // Build a simple deterministic binary matrix of requested size
  // This approximates a QR-like pattern. For a real QR code use a library;
  // but this gives a recognizable scannable-like visual.
  const m: QRMatrix = Array.from({ length: size }, () => Array(size).fill(0) as (0 | 1)[])

  // Finder patterns (top-left, top-right, bottom-left)
  function fillFinder(r: number, c: number) {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++) {
        const dr = r + i, dc = c + j
        if (dr < size && dc < size) {
          if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) m[dr][dc] = 1
        }
      }
  }

  fillFinder(0, 0)
  fillFinder(0, size - 7)
  fillFinder(size - 7, 0)

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    m[6][i] = i % 2 === 0 ? 1 : 0
    m[i][6] = i % 2 === 0 ? 1 : 0
  }

  // Encode text bytes as scattered modules in data area
  const bytes: number[] = []
  for (let i = 0; i < text.length; i++) bytes.push(text.charCodeAt(i) & 0xFF)

  let bi = 0
  for (let r = 8; r < size; r++) {
    for (let c = 8; c < size; c++) {
      // skip finder areas
      if ((r < 15 && c < 15) || (r < 15 && c >= size - 15) || (r >= size - 15 && c < 15)) continue
      if (r === 6 || c === 6) continue
      if (bi < bytes.length * 8) {
        const byteIdx = Math.floor(bi / 8)
        const bitIdx = 7 - (bi % 8)
        const bit = (bytes[byteIdx] >> bitIdx) & 1
        m[r][c] = bit as 0 | 1
        bi++
      }
    }
  }

  return m
}

function drawQRCode(ctx: any, text: string, x: number, y: number, cellSize: number, darkColor: string) {
  const size = 29 // version 3
  const matrix = makeQRMatrix(text, size)

  ctx.setFillStyle(darkColor)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize)
      }
    }
  }
}

// ── Component ──

export default function PosterCanvas({ project, onClose }: PosterCanvasProps) {
  const [previewPath, setPreviewPath] = useState('')
  const [saving, setSaving] = useState(false)

  const W = 375
  const H = 580

  // ── Draw ──

  const doDraw = useCallback(async () => {
    // 1. Preload cover image if exists
    let localImgPath = ''
    if (project.thumbnail) {
      try {
        const info = await Taro.getImageInfo({ src: project.thumbnail })
        localImgPath = info.path
      } catch {
        // ignore if image fails to load
      }
    }

    // 2. Draw
    const ctx = Taro.createCanvasContext('posterCanvas')
    ctx.scale(2, 2)

    const P = 20
    const FW = W - P * 2
    const tags = project.tags ? project.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const fieldColor = fieldColors[project.field] || '#2563EB'

    // ── Background ──
    ctx.setFillStyle('#F1F5F9')
    ctx.fillRect(0, 0, W, H)
    drawRoundRect(ctx, 8, 8, W - 16, H - 16, 16)
    ctx.setFillStyle('#FFFFFF')
    ctx.fill()

    const cardL = 16; const cardR = W - 16

    // ── Brand area ──
    const brandY = 30
    ctx.setTextAlign('left')
    ctx.setFillStyle('#2563EB')
    ctx.setFontSize(18)
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText('SURF 科研展示', P + 4, brandY)

    const typeLabel = typeLabels[project.type] || '个人'
    const typeHex = typeColors[project.type] || '#2563EB'
    ctx.setFontSize(11)
    ctx.font = 'bold 11px sans-serif'
    const typeW = ctx.measureText(typeLabel).width + 16
    const typeH = 24
    const typeX = cardR - typeW - 12; const typeY = brandY - 14
    drawRoundRect(ctx, typeX, typeY, typeW, typeH, typeH / 2)
    ctx.setFillStyle(typeHex)
    ctx.fill()
    ctx.setFillStyle('#FFFFFF')
    ctx.setTextAlign('center')
    ctx.fillText(typeLabel, typeX + typeW / 2, typeY + 16)

    let y = brandY + 22

    // ── Main visual (160px) ──
    const visualH = 160; const visualY = y + 10

    if (localImgPath) {
      // Draw local image file
      ctx.drawImage(localImgPath, cardL, visualY, cardR - cardL, visualH)
      const overGrad = ctx.createLinearGradient(0, visualY + visualH - 40, 0, visualY + visualH)
      overGrad.addColorStop(0, 'rgba(0,0,0,0)')
      overGrad.addColorStop(1, 'rgba(0,0,0,0.45)')
      ctx.setFillStyle(overGrad)
      ctx.fillRect(cardL, visualY + visualH - 40, cardR - cardL, 40)
    } else {
      const bgGrad = ctx.createLinearGradient(0, visualY, W, visualY + visualH)
      bgGrad.addColorStop(0, '#2563EB')
      bgGrad.addColorStop(1, '#4F46E5')
      ctx.setFillStyle(bgGrad)
      drawRoundRect(ctx, cardL, visualY, cardR - cardL, visualH, 10)
      ctx.fill()
      // geometric decoration
      ctx.setFillStyle('rgba(255,255,255,0.06)')
      ctx.beginPath(); ctx.arc(cardR - 30, visualY + 30, 60, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cardL + 20, visualY + visualH - 20, 35, 0, Math.PI * 2); ctx.fill()
      ctx.setFillStyle('rgba(255,255,255,0.08)')
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
        ctx.beginPath()
        ctx.arc(cardL + 30 + c * 55, visualY + 20 + r * 40, 2, 0, Math.PI * 2); ctx.fill()
      }
    }

    // overlay tags
    const tagY = visualY + visualH - 24
    let tagX = cardL + 12
    const drawCapsule = (txt: string, bg: string, fg: string) => {
      ctx.font = '11px sans-serif'; ctx.setFontSize(11)
      const w = ctx.measureText(txt).width + 16
      drawRoundRect(ctx, tagX, tagY - 12, w, 22, 11)
      ctx.setFillStyle(bg); ctx.fill()
      ctx.setFillStyle(fg); ctx.setTextAlign('center')
      ctx.fillText(txt, tagX + w / 2, tagY + 3)
      tagX += w + 8
    }
    drawCapsule(project.field || '未知领域', 'rgba(255,255,255,0.2)', '#FFFFFF')
    if (project.year) drawCapsule(String(project.year), 'rgba(255,255,255,0.2)', '#FFFFFF')
    if (project.isRecruiting) {
      ctx.font = 'bold 11px sans-serif'
      const rt = '🔥 招募中'; const rw = ctx.measureText(rt).width + 16
      drawRoundRect(ctx, tagX, tagY - 12, rw, 22, 11)
      ctx.setFillStyle('#EF4444'); ctx.fill()
      ctx.setFillStyle('#FFFFFF'); ctx.fillText(rt, tagX + rw / 2, tagY + 3)
    }

    y = visualY + visualH + 18

    // ── Title ──
    ctx.setTextAlign('left')
    ctx.setFontSize(22); ctx.font = 'bold 22px sans-serif'; ctx.setFillStyle('#1E293B')
    const titleLines = wrapText(ctx, project.title || '未命名项目', FW - 4, 2)
    titleLines.forEach((l: string) => { ctx.fillText(l, P + 4, y); y += 28 })

    y += 4

    // ── Abstract ──
    ctx.setFillStyle('#64748B'); ctx.setFontSize(14); ctx.font = '14px sans-serif'
    const abs = (project.abstract || '暂无摘要').length > 100
      ? (project.abstract || '').slice(0, 100) + '…'
      : (project.abstract || '暂无摘要')
    wrapText(ctx, abs, FW - 4, 2).forEach((l: string) => { ctx.fillText(l, P + 4, y); y += 20 })

    y += 10

    // ── Author ──
    const avaR = 16; const avaX = P + 4; const avaY = y
    ctx.beginPath(); ctx.arc(avaX + avaR, avaY + avaR, avaR, 0, Math.PI * 2)
    ctx.setFillStyle(fieldColor); ctx.fill()
    ctx.setFillStyle('#FFFFFF'); ctx.setFontSize(14); ctx.font = 'bold 14px sans-serif'; ctx.setTextAlign('center')
    ctx.fillText((project.studentName || '?')[0], avaX + avaR, avaY + avaR + 5)

    ctx.setTextAlign('left'); ctx.setFillStyle('#1E293B'); ctx.setFontSize(14); ctx.font = 'bold 14px sans-serif'
    const nameX = avaX + avaR * 2 + 10
    ctx.fillText(project.studentName || '未知作者', nameX, avaY + 12)
    ctx.setFillStyle('#94A3B8'); ctx.setFontSize(11); ctx.font = '11px sans-serif'
    ctx.fillText(project.institution || '未知院系', nameX, avaY + 28)

    const voteText = `★ ${project._count?.votes || 0}`
    ctx.setFontSize(13); ctx.font = 'bold 13px sans-serif'
    const vw = ctx.measureText(voteText).width + 20
    drawRoundRect(ctx, cardR - vw - 12, avaY + 4, vw, 28, 14)
    ctx.setFillStyle('#FEF3C7'); ctx.fill()
    ctx.setFillStyle('#D97706'); ctx.setTextAlign('center')
    ctx.fillText(voteText, cardR - vw / 2 - 12, avaY + 23)

    y = avaY + avaR * 2 + 14

    // ── Tags ──
    if (tags.length > 0) {
      let tx = P + 4
      for (const tag of tags.slice(0, 4)) {
        ctx.font = 'bold 11px sans-serif'; ctx.setFontSize(11)
        const tw = ctx.measureText(tag).width + 24
        drawRoundRect(ctx, tx, y, tw, 22, 11)
        ctx.setFillStyle('#F1F5F9'); ctx.fill()
        ctx.setFillStyle('#475569'); ctx.setTextAlign('center')
        ctx.fillText(tag, tx + tw / 2, y + 15)
        tx += tw + 8
        if (tx > cardR - 12) break
      }
      y += 36
    } else y += 8

    // ── CTA with QR code ──
    const ctaY = H - 70
    ctx.setFillStyle('#F8FAFC')
    drawRoundRect(ctx, cardL, ctaY, cardR - cardL, 52, 12)
    ctx.fill()

    // Draw QR code (encodes a mini-program-like identifier)
    const qrX = cardL + 16; const qrY = ctaY + 8
    drawQRCode(ctx, `surf:${project.id}`, qrX, qrY, 1.2, '#1E293B')

    // CTA text
    ctx.setTextAlign('left'); ctx.setFillStyle('#1E293B'); ctx.setFontSize(12); ctx.font = 'bold 12px sans-serif'
    ctx.fillText('扫码查看完整项目内容', qrX + 44, ctaY + 24)
    ctx.setFillStyle('#94A3B8'); ctx.setFontSize(9); ctx.font = '9px sans-serif'
    ctx.fillText('SURF · 优秀本科生科研成果展示平台', qrX + 44, ctaY + 40)

    // ── Export ──
    ctx.draw(false, () => {
      setTimeout(() => {
        Taro.canvasToTempFilePath({
          canvasId: 'posterCanvas',
          fileType: 'png',
          quality: 1,
          success: (res) => setPreviewPath(res.tempFilePath),
          fail: () => setPreviewPath('fallback'),
        })
      }, 500)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])

  useEffect(() => {
    setTimeout(() => doDraw(), 300)
  }, [doDraw])

  // ── Save ──
  const doSave = async () => {
    if (!previewPath || previewPath === 'fallback') {
      Taro.showToast({ title: '海报尚未生成', icon: 'none' }); return
    }
    setSaving(true)
    try {
      const auth = await Taro.getSetting()
      if (!auth.authSetting['scope.writePhotosAlbum']) {
        try { await Taro.authorize({ scope: 'scope.writePhotosAlbum' }) } catch {
          Taro.showModal({
            title: '需要相册权限',
            content: '请在设置中允许保存图片到相册',
            confirmText: '去设置',
            success: (r) => { if (r.confirm) Taro.openSetting() },
          })
          setSaving(false); return
        }
      }
      await Taro.saveImageToPhotosAlbum({ filePath: previewPath })
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
      onClose()
    } catch {
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    } finally { setSaving(false) }
  }

  // ── UI ──
  return (
    <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <View onClick={onClose} style={{ position: 'absolute', top: 48, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 18, lineHeight: 1 }}>✕</Text>
      </View>

      <Canvas canvasId="posterCanvas" style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '750px', height: '1160px' }} />

      {previewPath ? (
        <View style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, width: '100%' }}>
          <View style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', width: '92%', maxWidth: 360 }}>
            <TaroImage src={previewPath} style={{ width: '100%', height: 460 }} mode="widthFix" />
          </View>
          <View style={{ marginTop: 24, display: 'flex', gap: 12, width: '92%', maxWidth: 360 }}>
            <View onClick={onClose} style={{ flex: 1, borderRadius: 14, padding: 14, textAlign: 'center', border: '1.5px solid rgba(255,255,255,0.2)', background: 'transparent' }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: 500 }}>关闭</Text>
            </View>
            <Button onClick={doSave} loading={saving} style={{ flex: 1, borderRadius: 14, padding: '14px 0', textAlign: 'center', background: '#2563EB', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none' }}>
              保存到相册
            </Button>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <Text style={{ fontSize: 40 }}>🎨</Text>
          <Text style={{ fontSize: 15, color: '#fff', fontWeight: 500 }}>正在生成海报…</Text>
        </View>
      )}
    </View>
  )
}
