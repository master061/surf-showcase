const { callFunction } = require('../../utils/api')
const app = getApp()

Page({
  data: { loading: false },

  doLogin(userInfo) {
    this.setData({ loading: true })
    const data = {}
    if (userInfo) {
      data.userInfo = {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
      }
    }
    callFunction('wechatLogin', data).then(res => {
      const user = { ...res.user, _id: res.user._id || res.user.id }
      app.globalData.user = user
      app.globalData.token = 'wechat'
      wx.setStorageSync('user', JSON.stringify(user))
      wx.setStorageSync('token', 'wechat')

      if (res.isNewUser) {
        wx.redirectTo({ url: '/pages/complete-info/complete-info' })
      } else {
        wx.showToast({ title: '登录成功', icon: 'success' })
        wx.navigateBack()
      }
    }).catch(e => {
      wx.showToast({ title: e?.data?.error || '登录失败', icon: 'none' })
    }).finally(() => this.setData({ loading: false }))
  },

  wechatLogin() {
    // Try to get user profile (nickname + avatar)
    if (wx.getUserProfile) {
      wx.getUserProfile({
        desc: '用于展示用户信息',
        success: (res) => {
          this.doLogin(res.userInfo)
        },
        fail: () => {
          // User rejected or API not available, login without nickname
          this.doLogin(null)
        },
      })
    } else {
      // Fallback for older versions
      wx.getUserInfo({
        success: (res) => this.doLogin(res.userInfo),
        fail: () => this.doLogin(null),
      })
    }
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  },
})
