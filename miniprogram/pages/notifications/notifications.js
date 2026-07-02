const { callFunction } = require('../../utils/api')
Page({
  data: { notifications: [], loading: true, unreadCount: 0 },
  onShow() { this.loadData() },
  loadData() {
    this.setData({ loading: true })
    callFunction('getNotifications').then(res => {
      const list = res.notifications || []
      this.setData({
        notifications: list,
        unreadCount: list.filter(n => !n.read).length,
        loading: false,
      })
    }).catch(() => this.setData({ loading: false }))
  },
  onTap(e) {
    const id = e.currentTarget.dataset.id
    const projectId = e.currentTarget.dataset.projectid
    // Mark as read
    if (id) {
      const list = this.data.notifications.map(n => {
        if (n._id === id) n.read = true
        return n
      })
      this.setData({ notifications: list, unreadCount: list.filter(n => !n.read).length })
      callFunction('markNotificationRead', { id }).catch(() => {})
    }
    // Navigate to project
    if (projectId) wx.navigateTo({ url: '/pages/detail/detail?id=' + projectId })
  },
  markAllRead() {
    callFunction('markAllRead').then(() => {
      const list = this.data.notifications.map(n => { n.read = true; return n })
      this.setData({ notifications: list, unreadCount: 0 })
    })
  },
})
