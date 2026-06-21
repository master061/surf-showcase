const { callFunction, uploadImage, yearOpts } = require('../../utils/api')
const app = getApp()
Page({
  data: {
    name:'', bio:'', avatar:'', studentId:'', institution:'', yearIdx:3, email:'',
    loading:false, fetching:true, error:'', years: yearOpts,
  },
  onLoad() {
    callFunction('getMe').then(u => {
      this.setData({
        name: u.name, bio: u.bio || '', avatar: u.avatar || '',
        studentId: u.studentId || '', institution: u.institution || '',
        email: u.email, fetching: false,
        yearIdx: Math.max(0, yearOpts.indexOf(String(u.year || ''))),
      })
    }).catch(() => { wx.showToast({ title: '加载失败', icon: 'none' }); wx.navigateBack() })
  },
  onInput(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value }) },
  onYearChange(e) { this.setData({ yearIdx: Number(e.detail.value) }) },
  pickAvatar() {
    uploadImage().then(fileID => {
      this.setData({ avatar: fileID })
    }).catch(() => { wx.showToast({ title: '选择图片失败', icon: 'none' }) })
  },
  submit() {
    this.setData({ loading: true, error: '' })
    callFunction('updateProfile', {
      data: {
        name: this.data.name, email: this.data.email, avatar: this.data.avatar || undefined,
        bio: this.data.bio, studentId: this.data.studentId,
        institution: this.data.institution, year: this.data.years[this.data.yearIdx],
      },
    }).then(u => {
      const user = { ...u, _id: u._id || u.id }
      app.globalData.user = user
      wx.setStorageSync('user', JSON.stringify(user))
      wx.showToast({ title: '保存成功', icon: 'success' })
    }).catch((e) => {
      const msg = (e && e.data && e.data.error) ? e.data.error : '保存失败'
      console.error('Profile save error:', e)
      this.setData({ error: msg })
    }).finally(() => this.setData({ loading: false }))
  },
})
