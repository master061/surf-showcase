import { View, Canvas, Button, Text, Image as TaroImage } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro from '@tarojs/taro'
import type { Project } from '../../api'

const typeLabels: Record<string, string> = { INDIVIDUAL: '个人', TEAM: '团队', CLASS: '班级' }

function wrapText(ctx: any, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = []
  let current = ''
  for (let i = 0; i < text.length; i++) {
    const test = current + text[i]
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current)
      current = text[i]
      if (lines.length >= maxLines) break
    } else {
      current = test
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines
}

interface PosterCanvasProps {
  project: Project
  onClose: () => void
}

export default function PosterCanvas({ project, onClose }: PosterCanvasProps) {
  const [previewPath, setPreviewPath] = useState('')
  const [saving, setSaving] = useState(false)
  const W = 375
  const H = 600

  const doDraw = useCallback(() => {
    const ctx = Taro.createCanvasContext('posterCanvas')
    // Scale for sharper rendering
    ctx.scale(2, 2)

    // Background
    ctx.setFillStyle('#ffffff')
    ctx.fillRect(0, 0, W, H)

    // --- Header ---
    const hdrH = 90
    const grad = ctx.createLinearGradient(0, 0, W, 0)
    grad.addColorStop(0, '#1e40af')
    grad.addColorStop(1, '#4c1d95')
    ctx.setFillStyle(grad)
    ctx.fillRect(0, 0, W, hdrH)

    // Header white dots decoration
    ctx.setFillStyle('rgba(255,255,255,0.06)')
    ctx.beginPath()
    ctx.arc(W - 30, 20, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(50, 70, 30, 0, Math.PI * 2)
    ctx.fill()

    // Logo
    ctx.setFillStyle('#ffffff')
    ctx.setFontSize(20)
    ctx.setTextAlign('left')
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText('SURF 科研展示', 20, 36)

    ctx.setFontSize(8)
    ctx.font = '8px sans-serif'
    ctx.setFillStyle('rgba(255,255,255,0.55)')
    ctx.fillText('SUMMER UNDERGRADUATE RESEARCH FELLOWSHIP', 20, 52)

    ctx.fillText('探索本科生优秀科研成果', 20, 66)

    let y = hdrH + 22

    // --- Title ---
    ctx.setFillStyle('#111827')
    ctx.setFontSize(16)
    ctx.font = 'bold 16px sans-serif'
    ctx.setTextAlign('left')
    const titleLines = wrapText(ctx, project.title, W - 40, 2)
    titleLines.forEach((line: string) => {
      ctx.fillText(line, 20, y)
      y += 22
    })

    y += 6

    // --- Badges ---
    const bw = (W - 40 - 10) / 2
    const by = y
    // Field
    ctx.setFillStyle('#eff6ff')
    ctx.beginPath()
    ctx.arc(20 + 11, by + 10, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.arc(20 + bw - 11, by + 10, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(20 + 11, by, bw - 22, 20)
    ctx.fill()
    ctx.rect(20, by + 10, bw, 10)
    ctx.fill()
    ctx.setFillStyle('#1d4ed8')
    ctx.setFontSize(9)
    ctx.font = '9px sans-serif'
    ctx.setTextAlign('center')
    ctx.fillText(project.field, 20 + bw / 2, by + 13.5)

    // Year + Type
    const rx = 20 + bw + 10
    ctx.setFillStyle('#f0fdf4')
    ctx.beginPath()
    ctx.arc(rx + 11, by + 10, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.arc(rx + bw - 11, by + 10, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(rx + 11, by, bw - 22, 20)
    ctx.fill()
    ctx.rect(rx, by + 10, bw, 10)
    ctx.fill()
    ctx.setFillStyle('#15803d')
    const bText = [project.year, typeLabels[project.type] || project.type].filter(Boolean).join(' · ')
    ctx.fillText(bText, rx + bw / 2, by + 13.5)

    y += 36

    // --- Abstract ---
    ctx.setTextAlign('left')
    ctx.setFillStyle('#4b5563')
    ctx.setFontSize(11)
    ctx.font = '11px sans-serif'
    const abstract = project.abstract.length > 140 ? project.abstract.slice(0, 140) + '…' : project.abstract
    const absLines = wrapText(ctx, abstract, W - 40, 4)
    absLines.forEach((line: string) => {
      ctx.fillText(line, 20, y)
      y += 17
    })

    y += 10

    // --- Separator ---
    ctx.setStrokeStyle('#e5e7eb')
    ctx.setLineWidth(0.5)
    ctx.beginPath()
    ctx.moveTo(20, y)
    ctx.lineTo(W - 20, y)
    ctx.stroke()

    y += 16

    // --- Author ---
    ctx.setFillStyle('#111827')
    ctx.setFontSize(12)
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(`👤 ${project.studentName}`, 20, y)
    y += 18
    ctx.setFillStyle('#6b7280')
    ctx.setFontSize(10)
    ctx.font = '10px sans-serif'
    ctx.fillText(`🏫 ${project.institution}`, 20, y)
    y += 20

    // --- Tags ---
    const tags = project.tags ? project.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 4) : []
    if (tags.length > 0) {
      tags.forEach((tag: string) => {
        const tw = ctx.measureText(tag).width + 14
        ctx.setFillStyle('#f3f4f6')
        ctx.beginPath()
        ctx.arc(20 + 6, y + 6, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.arc(20 + tw - 6, y + 6, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillRect(20 + 6, y, tw - 12, 12)
        ctx.fill()
        ctx.rect(20, y + 6, tw, 6)
        ctx.fill()
        ctx.setFillStyle('#6b7280')
        ctx.setFontSize(8)
        ctx.font = '8px sans-serif'
        ctx.setTextAlign('center')
        ctx.fillText(tag, 20 + tw / 2, y + 8.5)
        y += 16
      })
    }

    y += 8

    // --- Stats row ---
    ctx.setFillStyle('#111827')
    ctx.setFontSize(11)
    ctx.font = 'bold 11px sans-serif'
    ctx.setTextAlign('left')
    ctx.fillText(`★ ${project._count.votes} 票`, 20, y)

    // --- Footer ---
    const footerY = H - 48
    ctx.setFillStyle('#f9fafb')
    ctx.fillRect(0, footerY, W, 48)
    ctx.setStrokeStyle('#e5e7eb')
    ctx.setLineWidth(0.5)
    ctx.beginPath()
    ctx.moveTo(0, footerY)
    ctx.lineTo(W, footerY)
    ctx.stroke()

    ctx.setFillStyle('#9ca3af')
    ctx.setFontSize(8)
    ctx.font = '8px sans-serif'
    ctx.setTextAlign('center')
    ctx.fillText('SURF 科研展示 · 优秀本科生科研成果展示平台', W / 2, footerY + 18)
    ctx.fillText('扫描小程序码 查看完整项目内容', W / 2, footerY + 30)

    ctx.draw(false, () => {
      // Export to temp file for preview
      setTimeout(() => {
        Taro.canvasToTempFilePath({
          canvasId: 'posterCanvas',
          fileType: 'png',
          quality: 1,
          success: (res) => setPreviewPath(res.tempFilePath),
          fail: () => setPreviewPath('fallback'),
        })
      }, 400)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])

  useEffect(() => {
    setTimeout(() => doDraw(), 300)
  }, [doDraw])

  const doSave = async () => {
    setSaving(true)
    try {
      const auth = await Taro.getSetting()
      if (!auth.authSetting['scope.writePhotosAlbum']) {
        try {
          await Taro.authorize({ scope: 'scope.writePhotosAlbum' })
        } catch {
          Taro.showModal({
            title: '需要相册权限',
            content: '请在设置中允许保存图片到相册',
            confirmText: '去设置',
            success: (r) => {
              if (r.confirm) Taro.openSetting()
            },
          })
          setSaving(false)
          return
        }
      }

      const canvasRes = await Taro.canvasToTempFilePath({
        canvasId: 'posterCanvas',
        fileType: 'png',
        quality: 1,
      })

      await Taro.saveImageToPhotosAlbum({
        filePath: canvasRes.tempFilePath,
      })
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
      onClose()
    } catch {
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Close button */}
      <View onClick={onClose} style={{ position: 'absolute', top: 48, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 18, lineHeight: 1 }}>✕</Text>
      </View>

      {/* Hidden canvas for drawing */}
      <Canvas canvasId="posterCanvas" style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '750px', height: '1200px' }} />

      {/* Loading or Preview */}
      {previewPath ? (
        <View style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', width: '100%' }}>
          {/* Poster image */}
          <View style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', width: '90%', maxWidth: 360 }}>
            <TaroImage src={previewPath} style={{ width: '100%', height: 480 }} mode="aspectFit" />
          </View>

          {/* Action buttons */}
          <View style={{ marginTop: 24, display: 'flex', gap: 12, width: '90%', maxWidth: 360 }}>
            <View className="btn btn-outline" style={{ flex: 1, borderRadius: 12, padding: 13, textAlign: 'center', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', background: 'transparent' }} onClick={onClose}>
              <Text style={{ color: '#fff', fontSize: 14 }}>关闭</Text>
            </View>
            <Button className="btn btn-primary" style={{ flex: 1, borderRadius: 12, padding: 13, textAlign: 'center', fontSize: 14, fontWeight: 600, border: 'none' }} loading={saving} onClick={doSave}>
              <Text style={{ color: '#fff', fontSize: 14 }}>保存到相册</Text>
            </Button>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Text style={{ fontSize: 36 }}>🎨</Text>
          <Text style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>正在生成海报…</Text>
        </View>
      )}
    </View>
  )
}
