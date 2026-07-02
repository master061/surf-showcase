const { callFunction } = require('../../utils/api')
const app = getApp()
Page({
  data: { projects: [], loading: true },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.fetchFavorites()
  },
  fetchFavorites() {
    this.setData({ loading: true })
    callFunction('getProjects', { limit: 50, sort: 'hot' }).then(r => {
      this.setData({ projects: (r.projects || []).slice(0, 4), loading: false })
    }).catch(() => this.setData({ loading: false }))
  },
  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id })
  },
})
