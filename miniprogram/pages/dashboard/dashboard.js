const { callFunction } = require('../../utils/api')
const app = getApp()
Page({
  data: { user:null, list:[], recruitProjects:[], doneProjects:[], loading:true, isLoggedIn:false },
  onShow(){
    const user = app.globalData.user
    const token = wx.getStorageSync('token')
    if (!token || !user) { this.setData({ isLoggedIn: false, loading: false }); return }
    this.setData({ user, isLoggedIn: true, loading: true })
    callFunction('getProjects', { sort: 'newest' }).then(r => {
      const my = r.projects.filter(p => p.userId === user._id || p.userId === user.id)
      const totalVotes = my.reduce((s, p) => s + (p.voteCount || 0), 0)
      this.setData({
        list: my,
        recruitProjects: my.filter(p => p.status === 'RECRUITING'),
        doneProjects: my.filter(p => p.status !== 'RECRUITING'),
        totalVotes: totalVotes,
        loading: false,
      })
    }).catch(() => this.setData({ loading: false }))
  },
  goLogin(){ wx.navigateTo({ url: '/pages/login/login' }) },
  goCreate(){ wx.navigateTo({ url: '/pages/create/create' }) },
  goEdit(e){ wx.navigateTo({ url: '/pages/edit/edit?id=' + e.currentTarget.dataset.id }) },
  logout(){
    wx.showModal({
      title: '提示', content: '确定退出登录？',
      success: r => {
        if (r.confirm) {
          app.globalData.user = null; app.globalData.token = ''
          wx.removeStorageSync('token'); wx.removeStorageSync('user')
          wx.reLaunch({ url: '/pages/index/index' })
        }
      },
    })
  },
})
