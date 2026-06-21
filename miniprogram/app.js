App({
  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-d5guoetsyfc49cfc7',
      traceUser: true,
    })

    // Session management
    const token = wx.getStorageSync('token')
    const user = wx.getStorageSync('user')
    if (token && user) {
      this.globalData.user = JSON.parse(user)
      this.globalData.token = token
    }
  },

  globalData: {
    user: null,
    token: '',
    isNewUser: false,
  },
})
