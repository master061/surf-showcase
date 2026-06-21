const typeLabels = { INDIVIDUAL: '个人项目', TEAM: '团队项目', CLASS: '班级项目' }

Component({
  properties: {
    project: { type: Object, value: {} },
  },
  data: {
    typeLabels,
    tags: [],
    showTags: [],
  },
  observers: {
    'project.tags'(t) {
      if (t) {
        const all = t.split(',').map(t => t.trim()).filter(Boolean)
        this.setData({ tags: all, showTags: all.slice(0, 3) })
      }
    },
  },
  methods: {
    onClick() {
      if (this.data.project && this.data.project._id) {
        wx.navigateTo({ url: '/pages/detail/detail?id=' + this.data.project._id })
      }
    },
  },
})
