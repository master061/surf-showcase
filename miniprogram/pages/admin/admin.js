const { callFunction } = require('../../utils/api')
const app = getApp()
Page({
  data: { stats: null, loading: true },
  onShow() {
    if (!app.globalData.user || app.globalData.user.role !== 'ADMIN') {
      wx.showToast({ title: '无权限', icon: 'none' })
      return wx.navigateBack()
    }
    this.loadStats()
  },
  loadStats() {
    this.setData({ loading: true })
    callFunction('getAdminStats').then(res => {
      this.setData({ stats: res.stats, loading: false })
    }).catch(() => this.setData({ loading: false }))
  },
})
