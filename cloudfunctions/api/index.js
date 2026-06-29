const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const bcrypt = require('bcryptjs')

const SALT_ROUNDS = 10
const USERS = 'users'
const PROJECTS = 'projects'
const VOTES = 'votes'
const NOTIFICATIONS = 'notifications'
const FIELDS = 'fields'
const ANNOUNCEMENTS = 'announcements'
const REPORTS = 'reports'
const ADMIN_LOGS = 'adminLogs'

function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function now() {
  return db.serverDate()
}

async function resolveUser(openid, token) {
  if (openid) {
    const res = await db.collection(USERS).where({ openid }).get()
    return res.data[0] || null
  }
  if (token) {
    const res = await db.collection(USERS).where({ token }).get()
    return res.data[0] || null
  }
  return null
}

function sanitize(u) {
  if (!u) return null
  const { password, token, ...rest } = u
  return rest
}

// ============== Handlers ==============

async function wechatLogin(userInfo) {
  const wxContext = cloud.getWXContext()
  let openid = wxContext.OPENID
  // 开发模式降级：模拟器环境下 OPENID 为空，使用固定 ID
  if (!openid) {
    openid = 'dev_test_openid_001'
  }

  let user = await resolveUser(openid, null)
  if (user) {
    const pj = await db.collection(PROJECTS).where({ userId: user._id }).count()
    return { user: { ...sanitize(user), _count: { projects: pj.total } }, isNewUser: false }
  }

  const nickName = (userInfo && userInfo.nickName) ? userInfo.nickName : `微信用户${openid.slice(-4)}`
  const avatarUrl = (userInfo && userInfo.avatarUrl) ? userInfo.avatarUrl : null
  const email = `wechat_${openid.slice(0, 12)}@surf.wechat`
  const r = await db.collection(USERS).add({
    data: {
      name: nickName, email, openid, avatar: avatarUrl,
      role: 'STUDENT', bio: null, studentId: null,
      institution: null, year: null, token: '', createdAt: now(), updatedAt: now(),
    },
  })
  user = (await db.collection(USERS).doc(r._id).get()).data
  return { user: sanitize(user), isNewUser: true }
}

async function emailLogin(email, password) {
  if (!email || !password) return { code: 400, error: '请填写邮箱和密码' }
  const res = await db.collection(USERS).where({ email }).get()
  const user = res.data[0]
  if (!user || !bcrypt.compareSync(password, user.password)) return { code: 401, error: '邮箱或密码错误' }
  const t = generateToken()
  await db.collection(USERS).doc(user._id).update({ data: { token: t } })
  user.token = t
  return { user: sanitize(user), token: t }
}

async function register(data) {
  const { name, email, password, studentId, institution, year } = data
  if (!name || !email || !password) return { code: 400, error: '请填写必填字段' }
  if (password.length < 6) return { code: 400, error: '密码至少6位' }
  const exist = await db.collection(USERS).where({ email }).get()
  if (exist.data.length > 0) return { code: 409, error: '邮箱已被注册' }
  const hashed = bcrypt.hashSync(password, SALT_ROUNDS)
  const t = generateToken()
  const r = await db.collection(USERS).add({
    data: {
      name, email, password: hashed, role: 'STUDENT',
      studentId: studentId || null, institution: institution || null,
      year: year ? parseInt(year) : null, openid: null, avatar: null,
      bio: null, token: t, createdAt: now(), updatedAt: now(),
    },
  })
  const user = (await db.collection(USERS).doc(r._id).get()).data
  return { user: sanitize(user), token: t }
}

async function getMe(openid, token) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '未登录' }
  const pj = await db.collection(PROJECTS).where({ userId: user._id }).count()
  return { ...sanitize(user), _count: { projects: pj.total } }
}

async function updateProfile(openid, token, data) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '未登录' }
  if (!data || typeof data !== 'object') return { code: 400, error: '参数错误' }
  const upd = {}
  const fields = ['name', 'email', 'avatar', 'bio', 'studentId', 'institution']
  fields.forEach(f => { if (data[f] !== undefined) upd[f] = data[f] })
  if (data.year !== undefined) upd.year = parseInt(data.year)
  upd.updatedAt = now()
  await db.collection(USERS).doc(user._id).update({ data: upd })
  return sanitize((await db.collection(USERS).doc(user._id).get()).data)
}

async function getProjects(params) {
  const { page = 1, limit = 20, sort = 'newest', field, type, year, tag, search, status, publishStatus } = params
  const p = parseInt(page), l = parseInt(limit)
  const cond = []
  if (field) cond.push({ field })
  if (type) cond.push({ type })
  if (year) cond.push({ year: parseInt(year) })
  if (status) cond.push({ status })
  if (publishStatus) cond.push({ publishStatus })
  if (!publishStatus) cond.push(_.or([{ publishStatus: 'APPROVED' }, { publishStatus: _.exists(false) }]))
  if (tag) cond.push({ tags: db.RegExp({ regexp: tag, options: 'i' }) })
  if (search) {
    const re = db.RegExp({ regexp: search, options: 'i' })
    cond.push(_.or([{ title: re }, { abstract: re }, { content: re }, { tags: re }, { field: re }, { studentName: re }]))
  }
  const where = cond.length > 0 ? _.and(cond) : {}
  const orderKey = sort === 'hot' ? 'voteCount' : 'createdAt'
  const orderDir = 'desc'
  const [projs, total] = await Promise.all([
    db.collection(PROJECTS).where(where).orderBy(orderKey, orderDir).skip((p - 1) * l).limit(l).get(),
    db.collection(PROJECTS).where(where).count(),
  ])
  return { projects: projs.data, total: total.total, page: p, totalPages: Math.ceil(total.total / l) }
}

async function getProject(id) {
  try {
    const p = (await db.collection(PROJECTS).doc(id).get()).data
    if (!p) return { code: 404, error: '项目不存在' }
    const u = (await db.collection(USERS).doc(p.userId).get()).data
    return { ...p, user: u ? { id: u._id, name: u.name, avatar: u.avatar, institution: u.institution } : null }
  } catch (e) { return { code: 404, error: '项目不存在' } }
}

async function createProject(openid, token, data) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '请先登录' }
  const {
    title, abstract, content, field, tags, thumbnail, studentName, institution,
    year, type, status, members, advisor, resultLinks,
    recruitCount, contactInfo, expectedDuration, recruitRequirements,
    methodology, researchMethods, processResults, conclusion,
    acknowledgments, references, projectUrl, socialLinks, contentImages,
  } = data
  if (!title || !abstract || !field) return { code: 400, error: '标题、摘要和领域为必填项' }
  const r = await db.collection(PROJECTS).add({
    data: {
      title, abstract, content: content || '', field, tags: tags || '', thumbnail: thumbnail || null,
      studentName: studentName || user.name, institution: institution || user.institution,
      year: year ? parseInt(year) : null, type: type || 'INDIVIDUAL', status: status || 'COMPLETED',
      publishStatus: 'DRAFT', version: 1, voteCount: 0, userId: user._id,
      members: members || null, advisor: advisor || null, resultLinks: resultLinks || null,
      recruitCount: recruitCount ? parseInt(recruitCount) : null,
      contactInfo: contactInfo || null, expectedDuration: expectedDuration || null,
      recruitRequirements: recruitRequirements || null,
      methodology: methodology || null, researchMethods: researchMethods || null,
      processResults: processResults || null, conclusion: conclusion || null,
      acknowledgments: acknowledgments || null, references: references || null,
      projectUrl: projectUrl || null, socialLinks: socialLinks || null,
      contentImages: contentImages || null, rejectReason: null,
      createdAt: now(), updatedAt: now(),
    },
  })
  return (await db.collection(PROJECTS).doc(r._id).get()).data
}

async function updateProject(openid, token, id, data) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '请先登录' }
  try {
    const p = (await db.collection(PROJECTS).doc(id).get()).data
    if (!p) return { code: 404, error: '项目不存在' }
    if (p.userId !== user._id && user.role !== 'ADMIN') return { code: 403, error: '无权限' }
    const upd = {}
    const strFields = ['title', 'abstract', 'content', 'field', 'tags', 'thumbnail', 'studentName', 'institution', 'status', 'members', 'advisor', 'resultLinks', 'contactInfo', 'expectedDuration', 'recruitRequirements', 'methodology', 'researchMethods', 'processResults', 'conclusion', 'acknowledgments', 'references', 'projectUrl', 'socialLinks', 'contentImages', 'rejectReason']
    strFields.forEach(f => { if (data[f] !== undefined) upd[f] = data[f] })
    if (data.year !== undefined) upd.year = parseInt(data.year)
    if (data.type !== undefined) upd.type = data.type
    if (data.recruitCount !== undefined) upd.recruitCount = parseInt(data.recruitCount)
    if (data.publishStatus !== undefined) upd.publishStatus = data.publishStatus
    if (data.version !== undefined) upd.version = data.version
    upd.updatedAt = now()
    await db.collection(PROJECTS).doc(id).update({ data: upd })
    return (await db.collection(PROJECTS).doc(id).get()).data
  } catch (e) { return { code: 404, error: '项目不存在' } }
}

async function deleteProject(openid, token, id) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '请先登录' }
  try {
    const p = (await db.collection(PROJECTS).doc(id).get()).data
    if (!p) return { code: 404, error: '项目不存在' }
    if (p.userId !== user._id && user.role !== 'ADMIN') return { code: 403, error: '无权限' }
    await db.collection(PROJECTS).doc(id).remove()
    await db.collection(VOTES).where({ projectId: id }).remove()
    if (p.userId !== user._id) {
      await createNotification(p.userId, 'delete', '项目已被删除', `你的项目「${p.title}」已被管理员删除`, id)
    }
    return { success: true }
  } catch (e) { return { code: 404, error: '项目不存在' } }
}

async function getSuggestions(q) {
  if (!q || q.length < 1) return { titles: [], tags: [], studentNames: [], fields: [] }
  const re = db.RegExp({ regexp: q, options: 'i' })
  const [titlesRes, tagsRes, namesRes, fieldsRes] = await Promise.all([
    db.collection(PROJECTS).where({ title: re }).limit(5).field({ title: true }).get(),
    db.collection(PROJECTS).where({ tags: re }).limit(10).field({ tags: true }).get(),
    db.collection(PROJECTS).where({ studentName: re }).limit(5).field({ studentName: true }).get(),
    db.collection(PROJECTS).where({ field: re }).limit(5).field({ field: true }).get(),
  ])
  const tagSet = new Set()
  tagsRes.data.forEach(p => { if (p.tags) p.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => tagSet.add(t)) })
  return {
    titles: titlesRes.data.map(p => p.title).slice(0, 5),
    tags: [...tagSet].slice(0, 5),
    studentNames: namesRes.data.map(p => p.studentName).slice(0, 5),
    fields: [...new Set(fieldsRes.data.map(p => p.field))].slice(0, 5),
  }
}

async function getUserVote(openid, token, projectId) {
  const user = await resolveUser(openid, token)
  if (!user) return { voted: false }
  const res = await db.collection(VOTES).where({ userId: user._id, projectId }).get()
  return { voted: res.data.length > 0 }
}

async function toggleVote(openid, token, projectId) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '请先登录' }
  try {
    const result = await db.runTransaction(async (transaction) => {
      const p = await transaction.collection(PROJECTS).doc(projectId).get()
      if (!p.data) return { code: 404, error: '项目不存在' }
      const exist = await transaction.collection(VOTES).where({ userId: user._id, projectId }).get()
      if (exist.data.length > 0) {
        await transaction.collection(VOTES).doc(exist.data[0]._id).remove()
        await transaction.collection(PROJECTS).doc(projectId).update({ data: { voteCount: _.inc(-1) } })
        return { voted: false, project: p.data }
      } else {
        await transaction.collection(VOTES).add({ data: { userId: user._id, projectId, createdAt: now() } })
        await transaction.collection(PROJECTS).doc(projectId).update({ data: { voteCount: _.inc(1) } })
        return { voted: true, project: p.data }
      }
    })
    if (result && result.voted && result.project && result.project.userId !== user._id) {
      await createNotification(result.project.userId, 'vote', '收到了投票', `${user.name} 赞了你的项目「${result.project.title}」`, projectId)
    }
    return result ? { voted: result.voted } : { code: 500, error: '操作失败' }
  } catch (e) { return { code: 500, error: '操作失败' } }
}

// ============== Publishing & Admin Handlers ==============
async function submitForReview(openid, token, id) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '请先登录' }
  try {
    const p = (await db.collection(PROJECTS).doc(id).get()).data
    if (!p) return { code: 404, error: '项目不存在' }
    if (p.userId !== user._id) return { code: 403, error: '无权限' }
    await db.collection(PROJECTS).doc(id).update({ data: { publishStatus: 'PENDING', updatedAt: now() } })
    await createNotification(user._id, 'submit', '项目已提交审核', `你的项目「${p.title}」已提交，请等待管理员审核`, id)
    return { success: true }
  } catch (e) { return { code: 404, error: '项目不存在' } }
}

async function approveProject(openid, token, id) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  try {
    const p = (await db.collection(PROJECTS).doc(id).get()).data
    if (!p) return { code: 404, error: '项目不存在' }
    await db.collection(PROJECTS).doc(id).update({
      data: { publishStatus: 'APPROVED', version: (p.version || 0) + 1, rejectReason: null, updatedAt: now() },
    })
    await createNotification(p.userId, 'approve', '项目已通过', `你的项目「${p.title}」已通过审核，正式发布`, id)
    return { success: true }
  } catch (e) { return { code: 404, error: '项目不存在' } }
}

async function rejectProject(openid, token, id, reason) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  try {
    const p = (await db.collection(PROJECTS).doc(id).get()).data
    if (!p) return { code: 404, error: '项目不存在' }
    await db.collection(PROJECTS).doc(id).update({
      data: { publishStatus: 'REJECTED', rejectReason: reason || '审核未通过', updatedAt: now() },
    })
    await createNotification(p.userId, 'reject', '项目被驳回', `你的项目「${p.title}」未通过审核，原因：${reason || '审核未通过'}`, id)
    return { success: true }
  } catch (e) { return { code: 404, error: '项目不存在' } }
}

async function getPendingProjects() {
  const res = await db.collection(PROJECTS).where({ publishStatus: 'PENDING' }).orderBy('createdAt', 'desc').get()
  return { projects: res.data }
}

async function getAdminStats(openid, token) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  const [totalProjects, totalUsers, pendingReviews, totalVotes] = await Promise.all([
    db.collection(PROJECTS).count(),
    db.collection(USERS).count(),
    db.collection(PROJECTS).where({ publishStatus: 'PENDING' }).count(),
    db.collection(VOTES).count(),
  ])
  return { stats: { totalProjects: totalProjects.total, totalUsers: totalUsers.total, pendingReviews: pendingReviews.total, totalVotes: totalVotes.total } }
}

async function getAllUsers(openid, token) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  const res = await db.collection(USERS).orderBy('createdAt', 'desc').get()
  return { users: res.data.map(u => { const { password, token, ...rest } = u; return rest }) }
}

async function setUserRole(openid, token, userId, role) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  await db.collection(USERS).doc(userId).update({ data: { role } })
  return { success: true }
}

// ============== Notification Helpers ==============
async function createNotification(userId, type, title, content, projectId) {
  await db.collection(NOTIFICATIONS).add({
    data: { userId, type, title, content, projectId: projectId || null, read: false, createdAt: now() },
  })
}

async function getNotifications(openid, token) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '未登录' }
  const res = await db.collection(NOTIFICATIONS).where({ userId: user._id }).orderBy('createdAt', 'desc').limit(50).get()
  return { notifications: res.data }
}

async function markNotificationRead(openid, token, id) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '未登录' }
  await db.collection(NOTIFICATIONS).doc(id).update({ data: { read: true } })
  return { success: true }
}

async function markAllRead(openid, token) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '未登录' }
  const res = await db.collection(NOTIFICATIONS).where({ userId: user._id, read: false }).get()
  await Promise.all(res.data.map(n => db.collection(NOTIFICATIONS).doc(n._id).update({ data: { read: true } })))
  return { success: true }
}

async function getUnreadCount(openid, token) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '未登录' }
  const res = await db.collection(NOTIFICATIONS).where({ userId: user._id, read: false }).count()
  return { count: res.total }
}

// ============== Admin Log Helper ==============
async function logAdminAction(adminId, action, detail) {
  await db.collection(ADMIN_LOGS).add({ data: { adminId, action, detail: detail || '', createdAt: now() } })
}

// ============== New Admin Handlers ==============
async function getAllProjects(openid, token, params) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  const { page = 1, limit = 20, status, publishStatus, field } = params
  const cond = []
  if (status) cond.push({ status })
  if (publishStatus) cond.push({ publishStatus })
  if (field) cond.push({ field })
  const where = cond.length ? _.and(cond) : {}
  const [projs, total] = await Promise.all([
    db.collection(PROJECTS).where(where).orderBy('createdAt', 'desc').skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit)).get(),
    db.collection(PROJECTS).where(where).count(),
  ])
  return { projects: projs.data, total: total.total }
}

async function getFullStats(openid, token) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  const [projects, users, votes, pending, fieldsCount, reports, logs] = await Promise.all([
    db.collection(PROJECTS).count(),
    db.collection(USERS).count(),
    db.collection(VOTES).count(),
    db.collection(PROJECTS).where({ publishStatus: 'PENDING' }).count(),
    db.collection(FIELDS).count(),
    db.collection(REPORTS).where({ resolved: false }).count(),
    db.collection(ADMIN_LOGS).orderBy('createdAt', 'desc').limit(10).get(),
  ])
  return {
    stats: {
      totalProjects: projects.total, totalUsers: users.total, totalVotes: votes.total,
      pendingReviews: pending.total, totalFields: fieldsCount.total, pendingReports: reports.total,
    },
    recentLogs: logs.data,
  }
}

// Fields management
const DEFAULT_ICONS = { '计算机科学':'💻','人工智能':'🤖','生物医药':'🧬','物理数学':'📐','化学材料':'🧪','工程技术':'⚙️','社会科学':'🏛️','人文艺术':'🎨' }
const ICON_LIST = ['💻','🤖','🧬','📐','🧪','⚙️','🏛️','🎨','📡','🔬','📊','🎯','📝','🔭','🧫','⚖️','🌍','🔮','🧩','🎵','📖','🎨','🏗️','🚀','💡','🔋','🧠','🖥️','📈','🔬','🌿','🔭']

async function getFields() {
  const defaults = [['计算机科学','💻'],['人工智能','🤖'],['生物医药','🧬'],['物理数学','📐'],['化学材料','🧪'],['工程技术','⚙️'],['社会科学','🏛️'],['人文艺术','🎨']]
  try {
    let res = await db.collection(FIELDS).orderBy('order', 'asc').get()
    const dbNames = new Set(res.data.map(f => f.name))
    // Auto-seed defaults + update missing icons
    for (const [name, icon] of defaults) {
      if (!dbNames.has(name)) {
        const count = await db.collection(FIELDS).count()
        await db.collection(FIELDS).add({ data: { name, icon, order: count.total + 1 } })
      } else {
        // Update existing entry if icon is missing
        const existing = res.data.find(f => f.name === name)
        if (existing && !existing.icon) {
          await db.collection(FIELDS).doc(existing._id).update({ data: { icon } })
        }
      }
    }
    // Also update any remaining entries without icons (custom fields)
    res = await db.collection(FIELDS).orderBy('order', 'asc').get()
    for (const f of res.data) {
      if (!f.icon) {
        await db.collection(FIELDS).doc(f._id).update({ data: { icon: '📁' } })
      }
    }
    // Re-fetch after seeding
    res = await db.collection(FIELDS).orderBy('order', 'asc').get()
    return { fields: res.data }
  } catch (e) {
    return { fields: defaults.map(([name, icon], i) => ({ name, icon, order: i })) }
  }
}
async function addField(openid, token, name, icon) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  const count = await db.collection(FIELDS).count()
  await db.collection(FIELDS).add({ data: { name, icon: icon || '📁', order: count.total + 1 } })
  await logAdminAction(user._id, 'addField', `添加研究领域：${name}`)
  return { success: true }
}
async function deleteField(openid, token, id) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  await db.collection(FIELDS).doc(id).remove()
  await logAdminAction(user._id, 'deleteField', `删除研究领域：${id}`)
  return { success: true }
}

// Announcements
async function getAnnouncements() {
  const res = await db.collection(ANNOUNCEMENTS).orderBy('createdAt', 'desc').limit(5).get()
  return { announcements: res.data }
}
async function addAnnouncement(openid, token, content) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  if (!content) return { code: 400, error: '请输入公告内容' }
  await db.collection(ANNOUNCEMENTS).add({ data: { content, active: true, createdAt: now() } })
  await logAdminAction(user._id, 'addAnnouncement', `发布公告：${content.slice(0, 30)}`)
  return { success: true }
}
async function updateAnnouncement(openid, token, id, content) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  if (!content) return { code: 400, error: '请输入公告内容' }
  await db.collection(ANNOUNCEMENTS).doc(id).update({ data: { content } })
  await logAdminAction(user._id, 'updateAnnouncement', `更新公告：${content.slice(0, 30)}`)
  return { success: true }
}
async function deleteAnnouncement(openid, token, id) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  await db.collection(ANNOUNCEMENTS).doc(id).remove()
  return { success: true }
}

// Report system
async function createReport(openid, token, projectId, reason) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '请先登录' }
  await db.collection(REPORTS).add({ data: { userId: user._id, projectId, reason: reason || '', resolved: false, createdAt: now() } })
  return { success: true }
}
async function getReports(openid, token) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  const res = await db.collection(REPORTS).where({ resolved: false }).orderBy('createdAt', 'desc').get()
  return { reports: res.data }
}
async function resolveReport(openid, token, id) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  const report = (await db.collection(REPORTS).doc(id).get()).data
  if (report) {
    await createNotification(report.userId, 'report', '举报已处理', `你举报的内容已由管理员处理`, report.projectId)
  }
  await db.collection(REPORTS).doc(id).update({ data: { resolved: true } })
  return { success: true }
}

// Logs
async function getAdminLogs(openid, token) {
  const user = await resolveUser(openid, token)
  if (!user || user.role !== 'ADMIN') return { code: 403, error: '无权限' }
  const res = await db.collection(ADMIN_LOGS).orderBy('createdAt', 'desc').limit(50).get()
  return { logs: res.data }
}

// ============== Public Stats ==============
async function getPublicStats() {
  const [totalProjects, totalUsers, totalVotes] = await Promise.all([
    db.collection(PROJECTS).count().catch(() => ({ total: 0 })),
    db.collection(USERS).count().catch(() => ({ total: 0 })),
    db.collection(VOTES).count().catch(() => ({ total: 0 })),
  ])
  return { totalProjects: totalProjects.total, totalUsers: totalUsers.total, totalVotes: totalVotes.total }
}

// 首次管理员设置：将当前登录用户设为管理员（仅首次使用）
async function setupAdmin(openid, token) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '请先登录' }
  // 检查是否已有管理员
  const admins = await db.collection(USERS).where({ role: 'ADMIN' }).get()
  if (admins.data.length > 0) return { code: 403, error: '已有管理员' }
  await db.collection(USERS).doc(user._id).update({ data: { role: 'ADMIN' } })
  return { success: true }
}

// ============== Router ==============
exports.main = async (event, context) => {
  const { action, ...params } = event
  const openid = (cloud.getWXContext().OPENID) || null

  const handlers = {
    wechatLogin: () => wechatLogin(params.userInfo),
    emailLogin: () => emailLogin(params.email, params.password),
    register: () => register(params),
    getMe: () => getMe(openid, params.token),
    updateProfile: () => updateProfile(openid, params.token, params.data || params),
    getProjects: () => getProjects(params),
    getProject: () => getProject(params.id),
    createProject: () => createProject(openid, params.token, params.data || params),
    updateProject: () => updateProject(openid, params.token, params.id, params.data || params),
    deleteProject: () => deleteProject(openid, params.token, params.id),
    getSuggestions: () => getSuggestions(params.q),
    toggleVote: () => toggleVote(openid, params.token, params.projectId),
    getUserVote: () => getUserVote(openid, params.token, params.projectId),
    submitForReview: () => submitForReview(openid, params.token, params.id),
    approveProject: () => approveProject(openid, params.token, params.id),
    rejectProject: () => rejectProject(openid, params.token, params.id, params.reason),
    getPendingProjects: () => getPendingProjects(),
    getAdminStats: () => getAdminStats(openid, params.token),
    getAllUsers: () => getAllUsers(openid, params.token),
    setUserRole: () => setUserRole(openid, params.token, params.userId, params.role),
    setupAdmin: () => setupAdmin(openid, params.token),
    getAllProjects: () => getAllProjects(openid, params.token, params),
    getFullStats: () => getFullStats(openid, params.token),
    getFields: () => getFields(),
    addField: () => addField(openid, params.token, params.name),
    deleteField: () => deleteField(openid, params.token, params.id),
    getAnnouncements: () => getAnnouncements(),
    addAnnouncement: () => addAnnouncement(openid, params.token, params.content),
    deleteAnnouncement: () => deleteAnnouncement(openid, params.token, params.id),
    updateAnnouncement: () => updateAnnouncement(openid, params.token, params.id, params.content),
    createReport: () => createReport(openid, params.token, params.projectId, params.reason),
    getReports: () => getReports(openid, params.token),
    resolveReport: () => resolveReport(openid, params.token, params.id),
    getAdminLogs: () => getAdminLogs(openid, params.token),
    getPublicStats: () => getPublicStats(),
    getNotifications: () => getNotifications(openid, params.token),
    markNotificationRead: () => markNotificationRead(openid, params.token, params.id),
    markAllRead: () => markAllRead(openid, params.token),
    getUnreadCount: () => getUnreadCount(openid, params.token),
  }

  const h = handlers[action]
  if (!h) return { code: 400, error: `未知操作: ${action}` }
  try { return await h() }
  catch (err) { console.error(`[${action}]`, err); return { code: 500, error: err.message || '服务器内部错误' } }
}
