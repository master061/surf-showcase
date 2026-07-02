const app = getApp()
Page({
  data: { project: null, previewPath: '', saving: false },
  onLoad() {
    const p = app.globalData.posterProject
    if (p) this.setData({ project: p }, () => this.drawPoster())
  },
  drawPoster() {
    const p = this.data.project
    if (!p) return
    const ctx = wx.createCanvasContext('posterCanvas')
    const W = 375, H = 600

    ctx.scale(1, 1)
    ctx.setFillStyle('#ffffff')
    ctx.fillRect(0, 0, W, H)

    // Header gradient
    const grad = ctx.createLinearGradient(0, 0, W, 0)
    grad.addColorStop(0, '#1e40af')
    grad.addColorStop(1, '#3730a3')
    ctx.setFillStyle(grad)
    ctx.fillRect(0, 0, W, 90)

    // Title
    ctx.setFillStyle('#ffffff')
    ctx.setFontSize(18)
    ctx.font = 'bold 18px sans-serif'
    ctx.setTextAlign('center')
    const title = p.title.length > 20 ? p.title.slice(0, 20) + '…' : p.title
    ctx.fillText(title, W / 2, 38)

    // Field badge
    ctx.setFontSize(11)
    ctx.font = '11px sans-serif'
    ctx.setFillStyle('rgba(255,255,255,0.2)')
    const fw = ctx.measureText(p.field).width + 20
    ctx.fillRect(W / 2 - fw / 2, 50, fw, 22)
    ctx.setFillStyle('#fff')
    ctx.fillText(p.field, W / 2, 65)

    // Abstract section
    ctx.setTextAlign('left')
    ctx.setFillStyle('#374151')
    ctx.setFontSize(12)
    ctx.font = '12px sans-serif'
    let y = 110
    ctx.fillText('📝 项目简介', 20, y)
    y += 22

    ctx.setFillStyle('#6b7280')
    ctx.setFontSize(11)
    ctx.font = '11px sans-serif'
    const abs = (p.abstract || '').length > 120 ? p.abstract.slice(0, 120) + '…' : p.abstract
    const absLines = this.wrapText(ctx, abs, W - 40, 5)
    absLines.forEach(line => { ctx.fillText(line, 20, y); y += 16 })

    y += 10

    // Separator
    ctx.setStrokeStyle('#e5e7eb')
    ctx.setLineWidth(0.5)
    ctx.beginPath()
    ctx.moveTo(20, y)
    ctx.lineTo(W - 20, y)
    ctx.stroke()
    y += 16

    // Author
    ctx.setFillStyle('#111827')
    ctx.setFontSize(13)
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText('👤 ' + p.studentName, 20, y)
    y += 20

    if (p.institution) {
      ctx.setFillStyle('#6b7280')
      ctx.setFontSize(11)
      ctx.font = '11px sans-serif'
      ctx.fillText('🏫 ' + p.institution, 20, y)
      y += 18
    }

    // Vote
    ctx.setFillStyle('#f59e0b')
    ctx.setFontSize(13)
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText('★ ' + (p.voteCount || 0) + ' 票', 20, y)

    // Status badge
    ctx.setTextAlign('right')
    ctx.setFontSize(11)
    ctx.font = '11px sans-serif'
    const statusText = p.status === 'RECRUITING' ? '🔍 招人中' : '✅ 已完成'
    ctx.setFillStyle(p.status === 'RECRUITING' ? '#fffbeb' : '#ecfdf5')
    const sw = ctx.measureText(statusText).width + 20
    ctx.fillRect(W - 20 - sw, y - 14, sw, 22)
    ctx.setFillStyle(p.status === 'RECRUITING' ? '#d97706' : '#059669')
    ctx.fillText(statusText, W - 20, y + 3)

    // Footer
    ctx.setTextAlign('left')
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
    ctx.setFontSize(9)
    ctx.font = '9px sans-serif'
    ctx.setTextAlign('center')
    ctx.fillText('SURF 科研展示 · 优秀本科生科研成果展示平台', W / 2, footerY + 18)
    ctx.fillText('扫描小程序码 查看完整项目内容', W / 2, footerY + 32)

    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: 'posterCanvas',
          fileType: 'png',
          quality: 1,
          success: (res) => this.setData({ previewPath: res.tempFilePath }),
          fail: () => this.setData({ previewPath: 'fallback' }),
        }, this)
      }, 500)
    })
  },
  wrapText(ctx, text, maxWidth, maxLines) {
    const lines = []
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
  },
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
                title: '需要相册权限',
                content: '请在设置中允许保存图片到相册',
                confirmText: '去设置',
                success: (r) => { if (r.confirm) wx.openSetting() },
              })
              this.setData({ saving: false })
            },
          })
        } else {
          this.doSave()
        }
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
