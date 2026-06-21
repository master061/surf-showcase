const { callFunction, uploadImage, fields, years, types, typeValues, durationOpts, recruitCountOpts } = require('../../utils/api')
Page({
  data: {
    id: '', loading: false, fetching: true, error: '',
    title:'', abstract:'', content:'', field:0, tags:'', thumbnail:'',
    studentName:'', institution:'', year:2, type:0, status:'COMPLETED',
    members:'', advisor:'', resultLinks:'',
    recruitCount:0, contactInfo:'', expectedDuration:'', recruitRequirements:'',
    fields, years, types, typeValues, durationOpts, recruitCountOpts, isRecruit: false,
  },
  onLoad(params) {
    if (!params.id) return
    this.setData({ id: params.id })
    callFunction('getProject', { id: params.id }).then(p => {
      this.setData({
        title: p.title, abstract: p.abstract, content: p.content,
        field: Math.max(0, fields.indexOf(p.field)),
        tags: p.tags, thumbnail: p.thumbnail || '',
        studentName: p.studentName, institution: p.institution,
        year: Math.max(0, years.indexOf(String(p.year || ''))),
        type: Math.max(0, typeValues.indexOf(p.type)),
        status: p.status || 'COMPLETED',
        members: p.members || '', advisor: p.advisor || '', resultLinks: p.resultLinks || '',
        recruitCount: p.recruitCount || 0, contactInfo: p.contactInfo || '',
        expectedDuration: p.expectedDuration || '', recruitRequirements: p.recruitRequirements || '',
        isRecruit: p.status === 'RECRUITING',
        fetching: false,
      })
    }).catch(() => { wx.showToast({ title: '加载失败', icon: 'none' }); wx.navigateBack() })
  },
  onInput(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value }) },
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
    callFunction('updateProject', { id: d.id, data }).then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' }); wx.navigateBack()
    }).catch(e => { this.setData({ error: e?.data?.error || '保存失败' }) }).finally(() => this.setData({ loading: false }))
  },
})
