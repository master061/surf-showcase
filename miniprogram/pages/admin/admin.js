const { callFunction } = require('../../utils/api')
const app = getApp()
Page({
  data: {
    tab: 'overview', loading: true, stats: {},
    allProjects: [], filterStatus: '',
    fields: [], newField: '', newFieldIcon: 0, iconList: ['💻','🤖','🧬','📐','🧪','⚙️','🏛️','🎨','📡','🔬','📊','🎯','📝','🔭','🧫','⚖️','🌍','🔮','🧩','🎵','📖','🎨','🏗️','🚀','💡','🔋','🧠','🖥️','📈','🔬','🌿','🔭'],
    announcements: [], newAnnounce: '',
    reports: [], logs: [],
  },
  onShow() {
    if (!app.globalData.user || app.globalData.user.role !== 'ADMIN') {
      wx.showToast({ title: '无权限', icon: 'none' }); wx.navigateBack(); return
    }
    this.switchTab({ currentTarget: { dataset: { tab: 'overview' } } })
  },
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ tab, loading: true })
    if (tab === 'overview') this.loadOverview()
    else if (tab === 'projects') this.loadProjects()
    else if (tab === 'fields') this.loadFields()
    else if (tab === 'announce') this.loadAnnouncements()
    else if (tab === 'reports') this.loadReports()
    else if (tab === 'logs') this.loadLogs()
  },
  loadOverview() {
    callFunction('getFullStats').then(r => {
      this.setData({ stats: r.stats || {}, logs: r.recentLogs || [], loading: false })
    }).catch(() => this.setData({ loading: false }))
  },
  loadProjects() {
    callFunction('getAllProjects', { status: this.data.filterStatus || undefined }).then(r => {
      this.setData({ allProjects: r.projects || [], loading: false })
    }).catch(() => this.setData({ loading: false }))
  },
  filterProjects(e) {
    this.setData({ filterStatus: e.currentTarget.dataset.status }, () => this.loadProjects())
  },
  loadFields() {
    callFunction('getFields').then(r => {
      this.setData({ fields: r.fields || [], loading: false })
    }).catch(() => this.setData({ loading: false }))
  },
  onFieldInput(e) { this.setData({ newField: e.detail.value }) },
  onIconChange(e) { this.setData({ newFieldIcon: Number(e.detail.value) }) },
  addField() {
    if (!this.data.newField) return
    callFunction('addField', { name: this.data.newField, icon: this.data.iconList[this.data.newFieldIcon] }).then(() => {
      this.setData({ newField: '', newFieldIcon: 0 }); wx.showToast({ title: '已添加', icon: 'success' }); this.loadFields()
    })
  },
  deleteField(e) {
    const id = e.currentTarget.dataset.id
    callFunction('deleteField', { id }).then(() => { wx.showToast({ title: '已删除', icon: 'success' }); this.loadFields() })
  },
  loadAnnouncements() {
    callFunction('getAnnouncements').then(r => {
      this.setData({ announcements: r.announcements || [], loading: false })
    }).catch(() => this.setData({ loading: false }))
  },
  onAnnounceInput(e) { this.setData({ newAnnounce: e.detail.value }) },
  addAnnouncement() {
    if (!this.data.newAnnounce) return
    callFunction('addAnnouncement', { content: this.data.newAnnounce }).then(() => {
      this.setData({ newAnnounce: '' }); wx.showToast({ title: '已发布', icon: 'success' }); this.loadAnnouncements()
    })
  },
  deleteAnnouncement(e) {
    callFunction('deleteAnnouncement', { id: e.currentTarget.dataset.id }).then(() => { this.loadAnnouncements() })
  },
  loadReports() {
    callFunction('getReports').then(r => {
      this.setData({ reports: r.reports || [], loading: false })
    }).catch(() => this.setData({ loading: false }))
  },
  resolveReport(e) {
    callFunction('resolveReport', { id: e.currentTarget.dataset.id }).then(() => {
      wx.showToast({ title: '已处理', icon: 'success' }); this.loadReports()
    })
  },
  loadLogs() {
    callFunction('getAdminLogs').then(r => {
      this.setData({ logs: r.logs || [], loading: false })
    }).catch(() => this.setData({ loading: false }))
  },
  delProject(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '确认删除', content: '确定要删除此项目吗？', success: r => {
      if (r.confirm) callFunction('deleteProject', { id }).then(() => {
        wx.showToast({ title: '已删除', icon: 'success' }); this.loadProjects()
      }).catch(() => wx.showToast({ title: '删除失败', icon: 'none' }))
    }})
  },
})
