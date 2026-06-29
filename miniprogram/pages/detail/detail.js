const { callFunction, typeLabels, formatDate, parseTags } = require('../../utils/api')
const app = getApp()
Page({
  data: { project: null, loading: true, voted: false, voteCount: 0, tags: [], typeLabels, user: null },
  onLoad(params) {
    this.setData({ user: app.globalData.user })
    if (!params.id) return
    callFunction('getProject', { id: params.id }).then(p => {
      this.setData({ project: p, voteCount: p.voteCount || 0, tags: parseTags(p.tags), loading: false })
      // Check if user has voted
      const token = wx.getStorageSync('token')
      if (token) {
        callFunction('getUserVote', { projectId: params.id }).then(r => {
          if (r && r.voted !== undefined) this.setData({ voted: r.voted })
        }).catch(() => {})
      }
    }).catch(() => { wx.showToast({ title: '加载失败', icon: 'none' }); wx.navigateBack() })
  },
  toggleVote() {
    const token = wx.getStorageSync('token')
    if (!token) { wx.navigateTo({ url: '/pages/login/login' }); return }
    callFunction('toggleVote', { projectId: this.data.project._id }).then(res => {
      this.setData({ voted: res.voted, voteCount: this.data.voteCount + (res.voted ? 1 : -1) })
    }).catch(() => wx.showToast({ title: '操作失败', icon: 'none' }))
  },
  goEdit() { wx.navigateTo({ url: '/pages/edit/edit?id=' + this.data.project._id }) },
  deleteProject() {
    wx.showModal({
      title: '确认删除', content: '确定要删除此项目吗？', success: r => {
        if (r.confirm) callFunction('deleteProject', { id: this.data.project._id }).then(() => {
          wx.showToast({ title: '删除成功', icon: 'success' }); wx.navigateBack()
        }).catch(() => wx.showToast({ title: '删除失败', icon: 'none' }))
      },
    })
  },
  contactOwner() {
    const info = this.data.project.contactInfo
    if (info) {
      wx.setClipboardData({ data: info, success: () => wx.showToast({ title: '已复制联系方式', icon: 'success' }) })
    }
  },
  reportProject() {
    wx.showModal({
      title: '举报项目', content: '请输入举报原因', editable: true, placeholderText: '请说明举报原因...', success: r => {
        if (r.confirm && r.content) callFunction('createReport', { projectId: this.data.project._id, reason: r.content }).then(() => {
          wx.showToast({ title: '举报已提交', icon: 'success' })
        }).catch(() => wx.showToast({ title: '举报失败', icon: 'none' }))
      },
    })
  },
})
