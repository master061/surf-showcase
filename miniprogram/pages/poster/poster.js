const app = getApp()
Page({
  data: { project: null, previewPath: '', saving: false },

  onLoad() {
    const p = app.globalData.posterProject
    if (p) this.setData({ project: p }, () => this.drawPoster())
  },

  // ── helpers ──

  r(x, y, w, h, r) {
    const ctx = this._ctx
    ctx.beginPath()
    ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
    ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2)
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5)
    ctx.arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI)
    ctx.closePath()
  },

  textWidth(text, size, bold) {
    this._ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`
    return this._ctx.measureText(text).width
  },

  setFont(size, bold) {
    this._ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`
  },

  lines(text, maxW, maxLines) {
    if (!text) return []
    const ctx = this._ctx
    const lines = []
    let cur = ''
    for (let i = 0; i < text.length; i++) {
      const test = cur + text[i]
      if (ctx.measureText(test).width > maxW && cur.length > 0) {
        lines.push(cur)
        cur = text[i]
        if (lines.length >= maxLines) break
      } else { cur = test }
    }
    if (cur && lines.length < maxLines) lines.push(cur)
    return lines
  },

  // ── draw ──

  drawPoster() {
    const p = this.data.project
    if (!p) return
    const ctx = wx.createCanvasContext('posterCanvas')
    this._ctx = ctx
    // Canvas CSS is 375×600; scale so we can draw at 750×1200 logical coords
    ctx.scale(0.5, 0.5)
    const W = 750, H = 1200

    // Parse data
    const tags = this.parseTags(p.tags)
    const typeLabel = { INDIVIDUAL: '个人', TEAM: '团队', CLASS: '班级' }[p.type] || '个人'
    const isRecruiting = p.status === 'RECRUITING'

    const doDraw = () => {
      // ── page background ──
      ctx.setFillStyle('#F0F4FB')
      ctx.fillRect(0, 0, W, H)

      // ── card ──
      const cardX = 32, cardW = W - 64
      ctx.setFillStyle('#FFFFFF')
      ctx.setShadow(0, 8, 40, 'rgba(0,0,0,0.08)')
      this.r(cardX, 32, cardW, H - 80, 32)
      ctx.fill()
      ctx.setShadow(0, 0, 0, 'rgba(0,0,0,0)')

      const P = 48 // card padding
      let y = 80

      // ═══════ 1. BRAND AREA ═══════
      ctx.setFillStyle('#2563EB')
      this.setFont(36, true)
      ctx.setTextAlign('left')
      ctx.fillText('SURF 科研展示', cardX + P, y + 36)

      // Type badge (right)
      ctx.setTextAlign('right')
      this.setFont(24, false)
      const tbadgeW = ctx.measureText(typeLabel).width + 36
      const tbadgeX = cardX + cardW - P - tbadgeW
      ctx.setFillStyle('#EFF6FF')
      this.r(tbadgeX, y + 4, tbadgeW, 48, 24)
      ctx.fill()
      ctx.setFillStyle('#2563EB')
      ctx.fillText(typeLabel, cardX + cardW - P - 18, y + 36)
      ctx.setTextAlign('left')

      y += 80

      // ═══════ 2. MAIN VISUAL (320px) ═══════
      const visX = cardX, visY = y, visW = cardW, visH = 320

      if (this._thumbPath) {
        // Draw image clipped to rounded rect
        ctx.save()
        this.r(visX, visY, visW, visH, 16)
        ctx.clip()
        ctx.drawImage(this._thumbPath, visX, visY, visW, visH)
        // Subtle top gradient — just enough for badge text readability
        const overlay = ctx.createLinearGradient(visX, visY, visX, visY + 100)
        overlay.addColorStop(0, 'rgba(0,0,0,0.25)')
        overlay.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.setFillStyle(overlay)
        ctx.fillRect(visX, visY, visW, 100)
        ctx.restore()
      } else {
        // Gradient fallback
        const grad = ctx.createLinearGradient(visX, visY, visX + visW, visY + visH)
        grad.addColorStop(0, '#1E40AF')
        grad.addColorStop(0.5, '#2563EB')
        grad.addColorStop(1, '#7C3AED')
        ctx.setFillStyle(grad)
        this.r(visX, visY, visW, visH, 16)
        ctx.fill()

        // Geometric decorations
        ctx.setFillStyle('rgba(255,255,255,0.06)')
        this.r(visX + visW - 180, visY - 40, 280, 280, 140)
        ctx.fill()
        ctx.setFillStyle('rgba(255,255,255,0.04)')
        this.r(visX - 60, visY + visH - 120, 200, 200, 100)
        ctx.fill()
        // Dots grid
        ctx.setFillStyle('rgba(255,255,255,0.08)')
        for (let dx = visX + 40; dx < visX + visW; dx += 60) {
          for (let dy = visY + 30; dy < visY + visH; dy += 60) {
            ctx.beginPath()
            ctx.arc(dx, dy, 3, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // Overlay badges on main visual
      const badgeY = visY + 24
      ctx.setTextAlign('left')

      // Field badge
      const fieldText = (p.field || '未分类')
      this.setFont(22, false)
      const fieldW = ctx.measureText(fieldText).width + 32
      ctx.setFillStyle('rgba(255,255,255,0.2)')
      this.r(visX + 32, badgeY, fieldW, 44, 22)
      ctx.fill()
      ctx.setFillStyle('#FFFFFF')
      ctx.fillText(fieldText, visX + 48, badgeY + 30)

      // Year badge
      if (p.year) {
        const yearText = String(p.year)
        this.setFont(22, false)
        const yearW = ctx.measureText(yearText).width + 32
        const yearBX = visX + 48 + fieldW
        ctx.setFillStyle('rgba(255,255,255,0.2)')
        this.r(yearBX, badgeY, yearW, 44, 22)
        ctx.fill()
        ctx.setFillStyle('#FFFFFF')
        ctx.fillText(yearText, yearBX + 16, badgeY + 30)
      }

      // Recruiting badge
      if (isRecruiting) {
        ctx.setTextAlign('right')
        const recText = '🔍 招募中'
        this.setFont(22, false)
        const recW = ctx.measureText(recText).width + 32
        ctx.setFillStyle('rgba(245,158,11,0.85)')
        this.r(visX + visW - 32 - recW, badgeY, recW, 44, 22)
        ctx.fill()
        ctx.setFillStyle('#FFFFFF')
        ctx.fillText(recText, visX + visW - 48, badgeY + 30)
        ctx.setTextAlign('left')
      }

      y += visH + 40

      // ═══════ 3. TITLE & ABSTRACT ═══════
      const bodyL = cardX + P
      const bodyW = cardW - P * 2

      // Title
      ctx.setFillStyle('#1E293B')
      const titleText = (p.title || '未命名项目')
      this.setFont(44, true)
      const titleLines = this.lines(titleText, bodyW, 2)
      titleLines.forEach((line, i) => {
        ctx.fillText(line, bodyL, y + 44 + i * 56)
      })
      y += titleLines.length * 56 + 24

      // Abstract
      if (p.abstract) {
        ctx.setFillStyle('#64748B')
        this.setFont(28, false)
        const absLines = this.lines(p.abstract, bodyW, 2)
        absLines.forEach((line, i) => {
          ctx.fillText(line, bodyL, y + 28 + i * 40)
        })
        y += absLines.length * 40 + 36
      } else {
        y += 20
      }

      // ═══════ 4. AUTHOR & DATA ═══════
      // Divider
      ctx.setStrokeStyle('#E2E8F0')
      ctx.setLineWidth(1)
      ctx.beginPath()
      ctx.moveTo(bodyL, y)
      ctx.lineTo(bodyL + bodyW, y)
      ctx.stroke()
      y += 40

      // Author avatar
      const avaSize = 72
      const initial = (p.studentName || '?')[0]
      const avaGrad = ctx.createLinearGradient(bodyL, y, bodyL + avaSize, y + avaSize)
      avaGrad.addColorStop(0, '#2563EB')
      avaGrad.addColorStop(1, '#7C3AED')
      ctx.setFillStyle(avaGrad)
      this.r(bodyL, y, avaSize, avaSize, avaSize / 2)
      ctx.fill()
      ctx.setFillStyle('#FFFFFF')
      this.setFont(32, true)
      ctx.setTextAlign('center')
      ctx.fillText(initial, bodyL + avaSize / 2, y + avaSize / 2 + 11)
      ctx.setTextAlign('left')

      // Name + institution
      const textX = bodyL + avaSize + 24
      ctx.setFillStyle('#1E293B')
      this.setFont(30, true)
      ctx.fillText(p.studentName || '未知作者', textX, y + 28)
      ctx.setFillStyle('#64748B')
      this.setFont(24, false)
      ctx.fillText((p.institution || '未知院校'), textX, y + 58)

      // Vote count (right side)
      ctx.setTextAlign('right')
      ctx.setFillStyle('#2563EB')
      this.setFont(48, true)
      const voteText = String(p.voteCount || 0)
      ctx.fillText(voteText, bodyL + bodyW, y + 40)
      this.setFont(22, false)
      ctx.setFillStyle('#64748B')
      ctx.fillText('获票', bodyL + bodyW, y + 66)
      ctx.setTextAlign('left')

      y += avaSize + 28

      // Tags
      if (tags.length > 0) {
        const tagColors = ['#EFF6FF', '#F0FDF4', '#FFF7ED', '#FDF2F8', '#F5F3FF', '#ECFEFF']
        const tagTextColors = ['#2563EB', '#16A34A', '#EA580C', '#DB2777', '#7C3AED', '#0891B2']
        let tagX = bodyL
        let tagY = y
        const tagH = 40
        tags.slice(0, 4).forEach((tag, i) => {
          this.setFont(22, false)
          const tw = ctx.measureText(tag).width + 32
          if (tagX + tw > bodyL + bodyW) {
            tagX = bodyL
            tagY += tagH + 12
          }
          ctx.setFillStyle(tagColors[i % tagColors.length])
          this.r(tagX, tagY, tw, tagH, tagH / 2)
          ctx.fill()
          ctx.setFillStyle(tagTextColors[i % tagTextColors.length])
          ctx.fillText(tag, tagX + 16, tagY + 28)
          tagX += tw + 12
        })
        y = tagY + tagH + 28
      } else {
        y += 10
      }

      // ═══════ 5. CTA AREA ═══════
      const ctaY = H - 200

      // Divider
      ctx.setStrokeStyle('#E2E8F0')
      ctx.setLineWidth(1)
      ctx.beginPath()
      ctx.moveTo(bodyL, ctaY)
      ctx.lineTo(bodyL + bodyW, ctaY)
      ctx.stroke()

      // QR code placeholder
      const qrSize = 120
      const qrX = cardX + P
      const qrY = ctaY + 36
      ctx.setFillStyle('#F1F5F9')
      this.r(qrX, qrY, qrSize, qrSize, 16)
      ctx.fill()
      // QR icon (simulated pattern)
      ctx.setFillStyle('#CBD5E1')
      this.r(qrX + 20, qrY + 20, qrSize - 40, qrSize - 40, 8)
      ctx.fill()
      ctx.setFillStyle('#F1F5F9')
      this.r(qrX + 30, qrY + 30, qrSize - 60, qrSize - 60, 4)
      ctx.fill()
      // Center QR dot
      ctx.setFillStyle('#2563EB')
      this.r(qrX + qrSize / 2 - 16, qrY + qrSize / 2 - 16, 32, 32, 8)
      ctx.fill()
      ctx.setFillStyle('#FFFFFF')
      this.setFont(20, true)
      ctx.setTextAlign('center')
      ctx.fillText('QR', qrX + qrSize / 2, qrY + qrSize / 2 + 7)
      ctx.setTextAlign('left')

      // CTA text
      const ctaTextX = qrX + qrSize + 28
      ctx.setFillStyle('#1E293B')
      this.setFont(30, true)
      ctx.fillText('扫码查看完整项目', ctaTextX, qrY + 44)
      ctx.setFillStyle('#64748B')
      this.setFont(24, false)
      ctx.fillText('了解更多研究详情与成果展示', ctaTextX, qrY + 80)

      // ── finalize ──
      ctx.draw(false, () => {
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvasId: 'posterCanvas',
            fileType: 'png',
            quality: 1,
            success: (res) => this.setData({ previewPath: res.tempFilePath }),
            fail: () => this.setData({ previewPath: 'fallback' }),
          }, this)
        }, 600)
      })
    }

    // Load thumbnail then draw
    if (p.thumbnail) {
      wx.getImageInfo({
        src: p.thumbnail,
        success: (res) => { this._thumbPath = res.path; doDraw() },
        fail: () => { this._thumbPath = null; doDraw() },
      })
    } else {
      this._thumbPath = null
      doDraw()
    }
  },

  parseTags(t) {
    if (!t) return []
    if (Array.isArray(t)) return t.filter(Boolean)
    return String(t).split(',').map(s => s.trim()).filter(Boolean)
  },

  // ── actions ──

  saveToAlbum() {
    if (!this.data.previewPath || this.data.previewPath === 'fallback') return
    this.setData({ saving: true })
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => this.doSave(),
            fail: () => {
              wx.showModal({
                title: '需要相册权限', content: '请在设置中允许保存图片到相册',
                confirmText: '去设置',
                success: (r) => { if (r.confirm) wx.openSetting() },
              })
              this.setData({ saving: false })
            },
          })
        } else { this.doSave() }
      },
    })
  },

  doSave() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.previewPath,
      success: () => { wx.showToast({ title: '已保存到相册', icon: 'success' }); this.setData({ saving: false }) },
      fail: () => { wx.showToast({ title: '保存失败', icon: 'none' }); this.setData({ saving: false }) },
    })
  },

  close() { wx.navigateBack() },
})
