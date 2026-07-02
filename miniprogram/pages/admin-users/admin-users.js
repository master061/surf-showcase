const { callFunction } = require('../../utils/api')
const app = getApp()
Page({
  data: { users: [], loading: true, hasAdmin: false, isAdmin: false },
  onShow() {
    const user = app.globalData.user
    this.setData({ isAdmin: user?.role === 'ADMIN' })
    this.loadUsers()
  },
  loadUsers() {
    this.setData({ loading: true })
    Promise.all([
      callFunction('getAllUsers').catch(() => ({ users: [] })),
    ]).then(([res]) => {
      const users = res.users || []
      const hasAdmin = users.some(u => u.role === 'ADMIN')
      this.setData({ users, hasAdmin, loading: false })
    }).catch(() => this.setData({ loading: false }))
  },
  setupAdmin() {
    wx.showLoading({ title: '设置中...' })
    callFunction('setupAdmin').then(res => {
      wx.hideLoading()
      if (res.success) {
        wx.showToast({ title: '已成为管理员', icon: 'success' })
        const user = app.globalData.user
        if (user) { user.role = 'ADMIN'; app.globalData.user = user; wx.setStorageSync('user', JSON.stringify(user)) }
        this.setData({ isAdmin: true, hasAdmin: true })
        this.loadUsers()
      }
    }).catch(e => {
      wx.hideLoading()
      wx.showToast({ title: e?.data?.error || '设置失败', icon: 'none' })
    })
  },
  setRole(e) {
    const { userId, role } = e.currentTarget.dataset
    const newRole = role === 'ADMIN' ? 'STUDENT' : 'ADMIN'
    callFunction('setUserRole', { userId, role: newRole }).then(() => {
      wx.showToast({ title: '已更新', icon: 'success' })
      this.loadUsers()
    }).catch(() => wx.showToast({ title: '操作失败', icon: 'none' }))
  },
})
