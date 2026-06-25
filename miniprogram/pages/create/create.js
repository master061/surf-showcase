const { callFunction, uploadImage, fields, years, types, typeValues, durationOpts, recruitCountOpts } = require('../../utils/api')
const app = getApp()

Page({
  data: {
    step: 1,
    loading: false, error: '',

    // Step 1 - Content
    title: '', field: 0, abstract: '', methodology: '', researchMethods: '',
    processResults: '', conclusion: '', acknowledgments: '', references: '',
    tags: '', thumbnail: '', year: 2, type: 0, status: 'COMPLETED',
    contentImages: [],

    // Step 2 - Contact & extras
    studentName: app.globalData.user?.name || '',
    institution: app.globalData.user?.institution || '',
    contactInfo: '', projectUrl: '', socialLinks: '',
    // completed fields
    members: '', advisor: '', resultLinks: '',
    // recruit fields
    recruitCount: 0, expectedDuration: '', recruitRequirements: '',

    // UI
    fields, years, types, typeValues, durationOpts, recruitCountOpts,
    isRecruit: false,
    imageUploading: false,
  },

  // Step navigation
  nextStep() {
    const d = this.data
    if (d.step === 1) {
      if (!d.title || !d.abstract) { this.setData({ error: '项目名称和摘要为必填项' }); return }
    }
    if (d.step === 2) {
      if (!d.contactInfo) { this.setData({ error: '联系方式为必填项' }); return }
    }
    this.setData({ error: '', step: d.step + 1 })
  },
  prevStep() { this.setData({ error: '', step: this.data.step - 1 }) },

  // Inputs
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

  // Image upload for rich text fields
  pickImage(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ imageUploading: true })
    uploadImage().then(fileID => {
      const existing = this.data.contentImages || []
      existing.push(fileID)
      const currentVal = this.data[field] || ''
      this.setData({
        [field]: currentVal + (currentVal ? '\n' : '') + '[图片](' + fileID + ')',
        contentImages: existing,
        imageUploading: false,
      })
    }).catch(() => { this.setData({ imageUploading: false }) })
  },

  // Submit
  submit() {
    this.setData({ loading: true, error: '' })
    const d = this.data
    const data = {
      title: d.title, abstract: d.abstract, field: d.fields[d.field],
      tags: d.tags, thumbnail: d.thumbnail || undefined,
      studentName: d.studentName, institution: d.institution,
      year: d.years[d.year], type: d.typeValues[d.type], status: d.status,
      methodology: d.methodology, researchMethods: d.researchMethods,
      processResults: d.processResults, conclusion: d.conclusion,
      acknowledgments: d.acknowledgments, references: d.references,
      contactInfo: d.contactInfo, projectUrl: d.projectUrl || undefined,
      socialLinks: d.socialLinks || undefined,
      contentImages: d.contentImages.join(',') || undefined,
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
      wx.showToast({ title: '保存成功', icon: 'success' })
      wx.redirectTo({ url: '/pages/detail/detail?id=' + r._id })
    }).catch(e => {
      this.setData({ error: e?.data?.error || '创建失败' })
    }).finally(() => this.setData({ loading: false }))
  },
})
