const { callFunction, uploadImage, fields, years, types, typeValues, durationOpts, recruitCountOpts } = require('../../utils/api')
const app = getApp()
Page({
  data: {
    title:'', abstract:'', content:'', field:0, tags:'', thumbnail:'',
    studentName: app.globalData.user?.name || '', institution: app.globalData.user?.institution || '',
    year:2, type:0, status:'COMPLETED', loading:false, error:'',
    members:'', advisor:'', resultLinks:'',
    recruitCount:0, contactInfo:'', expectedDuration:'', recruitRequirements:'',
    fields, years, types, typeValues, durationOpts, recruitCountOpts,
    isRecruit: false,
  },
  onInput(e) {
    const k = e.currentTarget.dataset.field
    const v = e.detail.value
    this.setData({ [k]: v })
  },
  onFieldChange(e) { this.setData({ field: Number(e.detail.value) }) },
  onYearChange(e) { this.setData({ year: Number(e.detail.value) }) },
  onTypeChange(e) { this.setData({ type: Number(e.detail.value) }) },
  onDurationChange(e) { this.setData({ expectedDuration: this.data.durationOpts[Number(e.detail.value)] }) },
  onRecruitCountChange(e) { this.setData({ recruitCount: Number(e.detail.value) + 1 }) },
  pickThumb() {
    uploadImage().then(fileID => {
      this.setData({ thumbnail: fileID })
    }).catch(() => {})
  },
  toggleStatus(e) {
    const v = e.currentTarget.dataset.value
    this.setData({ status: v, isRecruit: v === 'RECRUITING' })
  },
  submit() {
    const d = this.data
    if (!d.title || !d.abstract || !d.content) { this.setData({ error: '请填写必填项' }); return }
    this.setData({ loading: true, error: '' })
    const data = {
      title: d.title, abstract: d.abstract, content: d.content,
      field: d.fields[d.field], tags: d.tags,
      thumbnail: d.thumbnail || undefined,
      studentName: d.studentName, institution: d.institution,
      year: d.years[d.year], type: d.typeValues[d.type],
      status: d.status,
    }
    if (d.isRecruit) {
      data.recruitCount = d.recruitCount
      data.contactInfo = d.contactInfo
      data.expectedDuration = d.expectedDuration
      data.recruitRequirements = d.recruitRequirements
    } else {
      data.members = d.members
      data.advisor = d.advisor
      data.resultLinks = d.resultLinks
    }
    callFunction('createProject', { data }).then(r => {
      wx.redirectTo({ url: `/pages/detail/detail?id=${r._id}` })
    }).catch(e => { this.setData({ error: e?.data?.error || '发布失败' }) }).finally(() => this.setData({ loading: false }))
  },
})
