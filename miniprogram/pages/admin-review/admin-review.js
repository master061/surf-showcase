const { callFunction } = require('../../utils/api')
Page({
  data: { pendingList: [], approvedList: [], loading: true, tab: 'pending' },
  onShow() { this.loadData() },
  loadData() {
    this.setData({ loading: true })
    Promise.all([
      callFunction('getPendingProjects'),
      callFunction('getProjects', { publishStatus: 'APPROVED' }),
    ]).then(([pending, approved]) => {
      this.setData({ pendingList: pending.projects || [], approvedList: approved.projects || [], loading: false })
    }).catch(() => this.setData({ loading: false }))
  },
  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.tab }) },
  approve(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '确认通过', content: '通过此项目审核？', success: r => {
      if (r.confirm) callFunction('approveProject', { id }).then(() => {
        wx.showToast({ title: '已通过', icon: 'success' }); this.loadData()
      })
    }})
  },
  reject(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '驳回', content: '请输入驳回原因', editable: true, success: r => {
      if (r.confirm && r.content) callFunction('rejectProject', { id, reason: r.content }).then(() => {
        wx.showToast({ title: '已驳回', icon: 'success' }); this.loadData()
      })
    }})
  },
})
