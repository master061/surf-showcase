const { callFunction } = require('../../utils/api')
const app = getApp()
Page({
  data: { announcements: [], loading: true, editing: false, editId: '', editContent: '' },
  onShow() {
    this.loadAnnouncements()
  },
  loadAnnouncements() {
    this.setData({ loading: true })
    callFunction('getAnnouncements').then(r => {
      this.setData({ announcements: r.announcements || [], loading: false })
    }).catch(() => this.setData({ loading: false }))
  },
  openDetail(e) {
    const item = { _id: e.currentTarget.dataset.id, content: e.currentTarget.dataset.content, createdAt: e.currentTarget.dataset.createdat }
    app.globalData.pendingAnnouncement = item
    wx.navigateTo({ url: '/pages/announcement-detail/announcement-detail' })
  },
  startEdit(e) {
    e.stopPropagation ? e.stopPropagation() : ''
    const id = e.currentTarget.dataset.id
    const content = e.currentTarget.dataset.content
    this.setData({ editing: true, editId: id, editContent: content })
  },
  onEditInput(e) { this.setData({ editContent: e.detail.value }) },
  saveEdit() {
    if (!this.data.editContent) return
    callFunction('updateAnnouncement', { id: this.data.editId, content: this.data.editContent }).then(() => {
      wx.showToast({ title: '已更新', icon: 'success' })
      this.setData({ editing: false, editId: '', editContent: '' })
      this.loadAnnouncements()
    }).catch(() => wx.showToast({ title: '更新失败', icon: 'none' }))
  },
  cancelEdit() { this.setData({ editing: false, editId: '', editContent: '' }) },
})
