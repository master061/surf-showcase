const { callFunction } = require('../../utils/api')
const app = getApp()
Page({
  data: {
    loading: true,
    projects: [],
    tags: ['Featured', '人工智能', '生物医药', '物理数学', '化学材料', '工程技术'],
    activeTag: 'Featured',
    search: '',
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    this.fetchProjects()
  },
  fetchProjects() {
    this.setData({ loading: true })
    callFunction('getProjects', { limit: 20, sort: 'hot' }).then(r => {
      this.setData({ projects: r.projects || [], loading: false })
    }).catch(() => this.setData({ loading: false }))
  },
  onTagTap(e) {
    this.setData({ activeTag: e.currentTarget.dataset.tag })
  },
  onSearchInput(e) {
    this.setData({ search: e.detail.value })
  },
  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id })
  },
})
