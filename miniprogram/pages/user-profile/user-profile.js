const app = getApp()
Page({
  data: { user: null },
  onLoad() {
    this.setData({ user: app.globalData.viewUser || null })
  },
  copyContact() {
    const info = this.data.user?.contactInfo
    if (info && info !== '未提供') {
      wx.setClipboardData({ data: info, success: () => wx.showToast({ title: '已复制', icon: 'success' }) })
    }
  },
})
