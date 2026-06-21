const { callFunction } = require('../../utils/api')
const app = getApp()

Page({
  data: { loading: false },

  wechatLogin(userInfo) {
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

  onGetUserInfo(e) {
    const userInfo = e.detail.userInfo
    if (userInfo) {
      // 用户授权了微信信息
      wx.login({
        success: (res) => {
          if (res.code) {
            this.wechatLogin(userInfo)
          }
        },
      })
    } else {
      // 用户拒绝授权，使用降级登录（没有昵称）
      this.wechatLogin(null)
    }
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  },
})
