// API 工具 — 封装云函数调用
const app = getApp()

function getToken() {
  try { return wx.getStorageSync('token') } catch { return '' }
}

function callFunction(action, data = {}) {
  const token = getToken()
  return wx.cloud.callFunction({
    name: 'api',
    data: { action, ...data, ...(token ? { token } : {}) },
  }).then(res => {
    const result = res.result
    if (result && result.code && result.code >= 400) {
      throw { status: result.code, data: { error: result.error } }
    }
    return result
  })
}

const typeLabels = { INDIVIDUAL: '个人项目', TEAM: '团队项目' }
const statusStyles = {
  COMPLETED: { label: '✅ 已完成', cls: 'badge badge-done' },
  RECRUITING: { label: '🔍 招人中', cls: 'badge badge-recruit' },
}

function formatDate(str) {
  if (!str) return ''
  return str.split('T')[0] || str.substring(0, 10)
}

function parseTags(str) {
  if (!str) return []
  return str.split(',').map(t => t.trim()).filter(Boolean)
}

const fields = ['计算机科学', '人工智能', '生物医药', '物理数学', '化学材料', '工程技术', '社会科学', '人文艺术']
const years = ['2023', '2024', '2025', '2026']
const types = ['个人项目', '团队项目']
const typeValues = ['INDIVIDUAL', 'TEAM']
const yearOpts = ['2022', '2023', '2024', '2025', '2026', '2027']
const durationOpts = ['3个月', '6个月', '1年', '1年以上']
const recruitCountOpts = ['1人', '2人', '3人', '4人', '5人', '5人以上']

// 图片上传 — 从相册选择并上传到云存储
function uploadImage() {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const filePath = res.tempFilePaths[0]
        const cloudPath = 'images/' + Date.now() + '-' + Math.random().toString(36).slice(-6) + '.' + (filePath.match(/\.(\w+)$/)?.[1] || 'jpg')
        wx.showLoading({ title: '上传中...' })
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: (uploadRes) => {
            wx.hideLoading()
            resolve(uploadRes.fileID)
          },
          fail: (err) => {
            wx.hideLoading()
            reject(err)
          },
        })
      },
      fail: reject,
    })
  })
}

module.exports = {
  callFunction, uploadImage, typeLabels, statusStyles, formatDate, parseTags,
  fields, years, types, typeValues, yearOpts, durationOpts, recruitCountOpts,
}
