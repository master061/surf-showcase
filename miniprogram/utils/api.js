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

// 多图上传 — 从相册选择多张图片并逐一上传到云存储
function uploadImages(existing = '') {
  const existingList = existing ? existing.split(',').filter(Boolean) : []
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count: 9 - existingList.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const files = res.tempFilePaths
        let done = 0
        const results = [...existingList]
        wx.showLoading({ title: '上传中 0/' + files.length })
        files.forEach((filePath, idx) => {
          const cloudPath = 'images/' + Date.now() + '-' + idx + '-' + Math.random().toString(36).slice(-6) + '.' + (filePath.match(/\.(\w+)$/)?.[1] || 'jpg')
          wx.cloud.uploadFile({
            cloudPath,
            filePath,
            success: (uploadRes) => {
              done++
              wx.showLoading({ title: '上传中 ' + done + '/' + files.length })
              results[existingList.length + idx] = uploadRes.fileID
              if (done === files.length) {
                wx.hideLoading()
                resolve(results.filter(Boolean).join(','))
              }
            },
            fail: (err) => {
              wx.hideLoading()
              reject(err)
            },
          })
        })
      },
      fail: reject,
    })
  })
}

// 解析图片字符串为数组
function parseImages(str) {
  if (!str) return []
  return String(str).split(',').map(s => s.trim()).filter(Boolean)
}

// 将 cloud:// 文件 ID 转为可显示的临时 HTTPS URL
function getTempUrls(cloudIdsStr) {
  const fileIDs = parseImages(cloudIdsStr)
  if (!fileIDs.length) return Promise.resolve([])
  return wx.cloud.getTempFileURL({ fileList: fileIDs }).then(res => {
    return res.fileList.map(f => f.tempFileURL || '').filter(Boolean)
  }).catch(() => {
    // 模拟器降级：逐个 downloadFile
    return Promise.all(fileIDs.map(id => {
      if (!id || !id.startsWith('cloud://')) return Promise.resolve('')
      return wx.cloud.downloadFile({ fileID: id })
        .then(r => r.tempFilePath || '')
        .catch(() => '')
    })).then(paths => paths.filter(Boolean))
  })
}

// 单张图片 URL 转换
function getTempUrl(cloudId) {
  if (!cloudId) return Promise.resolve('')
  return getTempUrls(cloudId).then(urls => urls[0] || '')
}

module.exports = {
  callFunction, uploadImage, uploadImages, parseImages, getTempUrls, getTempUrl,
  typeLabels, statusStyles, formatDate, parseTags,
  fields, years, types, typeValues, yearOpts, durationOpts, recruitCountOpts,
}
