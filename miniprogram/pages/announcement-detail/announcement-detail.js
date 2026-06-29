const { callFunction } = require('../../utils/api')
const app = getApp()
Page({
  data: { announcement: null, editing: false, editContent: '' },
  onLoad() {
    const item = app.globalData.pendingAnnouncement
    if (item) {
      this.setData({ announcement: item })
      app.globalData.pendingAnnouncement = null
    }
  },
  startEdit() {
    this.setData({ editing: true, editContent: this.data.announcement.content })
  },
  onEditInput(e) { this.setData({ editContent: e.detail.value }) },
  saveEdit() {
    if (!this.data.editContent) return
    callFunction('updateAnnouncement', { id: this.data.announcement._id, content: this.data.editContent }).then(() => {
      wx.showToast({ title: '已更新', icon: 'success' })
      this.setData({ editing: false, 'announcement.content': this.data.editContent })
    }).catch(() => wx.showToast({ title: '更新失败', icon: 'none' }))
  },
  cancelEdit() { this.setData({ editing: false, editContent: '' }) },
})
