const { callFunction, uploadImage, fields, years, types, typeValues, durationOpts, recruitCountOpts } = require('../../utils/api')
const app = getApp()

Page({
  data: {
    step: 1, loading: false, error: '',

    // Basic info
    title: '', field: 0, type: 0, year: 2,
    studentName: app.globalData.user?.name || '',
    institution: app.globalData.user?.institution || '',
    advisor: '', members: '',

    // Project content
    abstract: '', content: '', tags: '', thumbnail: '',

    // Contact
    contactInfo: '', projectUrl: '',

    // Status
    status: 'COMPLETED', isRecruit: false,

    // Completed extras
    resultLinks: '',

    // Recruit extras
    recruitCount: 0, expectedDuration: '', recruitRequirements: '',

    // UI data
    fields, years, types, typeValues, durationOpts, recruitCountOpts,
  },

  nextStep() {
    const d = this.data
    if (d.step === 1) {
      if (!d.title || !d.abstract) { this.setData({ error: '项目名称和简介为必填项' }); return }
    }
    if (d.step === 2 && !d.contactInfo) { this.setData({ error: '联系方式为必填项' }); return }
    this.setData({ error: '', step: d.step + 1 })
  },
  prevStep() { this.setData({ error: '', step: this.data.step - 1 }) },

  onInput(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value }) },
  onFieldChange(e) { this.setData({ field: Number(e.detail.value) }) },
  onYearChange(e) { this.setData({ year: Number(e.detail.value) }) },
  onTypeChange(e) { this.setData({ type: Number(e.detail.value) }) },
  onDurationChange(e) { this.setData({ expectedDuration: this.data.durationOpts[Number(e.detail.value)] }) },
  onRecruitCountChange(e) { this.setData({ recruitCount: Number(e.detail.value) + 1 }) },
  toggleStatus(e) {
    const v = e.currentTarget.dataset.value
    this.setData({ status: v, isRecruit: v === 'RECRUITING' })
  },

  pickThumb() {
    uploadImage().then(fileID => {
      this.setData({ thumbnail: fileID })
    }).catch(() => {})
  },

  submitAndReview() {
    this.setData({ loading: true, error: '' })
    const d = this.data
    const data = {
      title: d.title, abstract: d.abstract, content: d.content || '',
      field: d.fields[d.field], tags: d.tags,
      thumbnail: d.thumbnail || undefined,
      studentName: d.studentName, institution: d.institution,
      year: d.years[d.year], type: d.typeValues[d.type],
      status: d.status, advisor: d.advisor,
      contactInfo: d.contactInfo, projectUrl: d.projectUrl || undefined,
    }
    if (d.typeValues[d.type] === 'TEAM') data.members = d.members
    if (d.isRecruit) {
      data.recruitCount = d.recruitCount
      data.expectedDuration = d.expectedDuration
      data.recruitRequirements = d.recruitRequirements
    } else {
      data.resultLinks = d.resultLinks
    }
    callFunction('createProject', { data }).then(r => {
      return callFunction('submitForReview', { id: r._id }).then(() => r)
    }).then(r => {
      wx.showToast({ title: '已提交审核', icon: 'success' })
      wx.redirectTo({ url: '/pages/detail/detail?id=' + r._id })
    }).catch(e => {
      this.setData({ error: e?.data?.error || '创建失败' })
    }).finally(() => this.setData({ loading: false }))
  },
})
