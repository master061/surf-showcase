const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const bcrypt = require('bcryptjs')

const SALT_ROUNDS = 10
const USERS = 'users'
const PROJECTS = 'projects'
const VOTES = 'votes'

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
  const { page = 1, limit = 20, sort = 'newest', field, type, year, tag, search, status } = params
  const p = parseInt(page), l = parseInt(limit)
  const cond = []
  if (field) cond.push({ field })
  if (type) cond.push({ type })
  if (year) cond.push({ year: parseInt(year) })
  if (status) cond.push({ status })
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
  const { title, abstract, content, field, tags, thumbnail, studentName, institution, year, type, status, members, advisor, resultLinks, recruitCount, contactInfo, expectedDuration, recruitRequirements } = data
  if (!title || !abstract || !content || !field) return { code: 400, error: '标题、摘要、内容和领域为必填项' }
  const r = await db.collection(PROJECTS).add({
    data: {
      title, abstract, content, field, tags: tags || '', thumbnail: thumbnail || null,
      studentName: studentName || user.name, institution: institution || user.institution,
      year: year ? parseInt(year) : null, type: type || 'INDIVIDUAL', status: status || 'COMPLETED',
      voteCount: 0, userId: user._id, members: members || null, advisor: advisor || null,
      resultLinks: resultLinks || null, recruitCount: recruitCount ? parseInt(recruitCount) : null,
      contactInfo: contactInfo || null, expectedDuration: expectedDuration || null,
      recruitRequirements: recruitRequirements || null, createdAt: now(), updatedAt: now(),
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
    const strFields = ['title', 'abstract', 'content', 'field', 'tags', 'thumbnail', 'studentName', 'institution', 'status', 'members', 'advisor', 'resultLinks', 'contactInfo', 'expectedDuration', 'recruitRequirements']
    strFields.forEach(f => { if (data[f] !== undefined) upd[f] = data[f] })
    if (data.year !== undefined) upd.year = parseInt(data.year)
    if (data.type !== undefined) upd.type = data.type
    if (data.recruitCount !== undefined) upd.recruitCount = parseInt(data.recruitCount)
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

async function toggleVote(openid, token, projectId) {
  const user = await resolveUser(openid, token)
  if (!user) return { code: 401, error: '请先登录' }
  try {
    return await db.runTransaction(async (transaction) => {
      const p = await transaction.collection(PROJECTS).doc(projectId).get()
      if (!p.data) return { code: 404, error: '项目不存在' }
      const exist = await transaction.collection(VOTES).where({ userId: user._id, projectId }).get()
      if (exist.data.length > 0) {
        await transaction.collection(VOTES).doc(exist.data[0]._id).remove()
        await transaction.collection(PROJECTS).doc(projectId).update({ data: { voteCount: _.inc(-1) } })
        return { voted: false }
      } else {
        await transaction.collection(VOTES).add({ data: { userId: user._id, projectId, createdAt: now() } })
        await transaction.collection(PROJECTS).doc(projectId).update({ data: { voteCount: _.inc(1) } })
        return { voted: true }
      }
    })
  } catch (e) { return { code: 500, error: '操作失败' } }
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
  }

  const h = handlers[action]
  if (!h) return { code: 400, error: `未知操作: ${action}` }
  try { return await h() }
  catch (err) { console.error(`[${action}]`, err); return { code: 500, error: err.message || '服务器内部错误' } }
}
