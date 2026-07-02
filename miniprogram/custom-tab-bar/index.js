Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: 'home' },
      { pagePath: '/pages/projects/projects', text: '项目', icon: 'grid' },
      { pagePath: '/pages/explore/explore', text: '探索', icon: 'compass' },
      { pagePath: '/pages/favorites/favorites', text: '收藏', icon: 'bookmark' },
      { pagePath: '/pages/dashboard/dashboard', text: '我的', icon: 'user' },
    ]
  },
  pageLifetimes: {
    show() {
      const page = getCurrentPages().pop()
      const route = page ? page.route : ''
      const index = this.data.list.findIndex(item => item.pagePath === `/${route}`)
      if (index !== -1 && this.data.selected !== index) {
        this.setData({ selected: index })
      }
    }
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      wx.switchTab({ url: data.path })
    }
  }
})
