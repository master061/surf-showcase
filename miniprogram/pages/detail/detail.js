const { callFunction, typeLabels, formatDate, parseTags } = require('../../utils/api')
const app = getApp()
Page({
  data: { project: null, loading: true, voted: false, voteCount: 0, tags: [], typeLabels },
  onLoad(params) {
    if (!params.id) return
    callFunction('getProject', { id: params.id }).then(p => {
      this.setData({ project: p, voteCount: p.voteCount || 0, tags: parseTags(p.tags), loading: false })
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
})
