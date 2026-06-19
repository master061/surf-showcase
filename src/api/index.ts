import Taro from '@tarojs/taro'

const BASE_URL = 'http://localhost:3000/api'

function getToken() {
  try { return Taro.getStorageSync('token') } catch { return '' }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await Taro.request({
    url: `${BASE_URL}${path}`,
    method: (options.method || 'GET') as any,
    data: options.body ? JSON.parse(options.body as string) : undefined,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (res.statusCode >= 400) {
    throw { status: res.statusCode, data: res.data }
  }
  return res.data as T
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  studentId?: string | null
  institution?: string | null
  year?: number | null
  avatar?: string | null
  bio?: string | null
  _count?: { projects: number }
}

export interface Project {
  id: string
  title: string
  abstract: string
  content: string
  field: string
  tags: string
  thumbnail?: string | null
  studentName: string
  institution: string
  year?: number | null
  type: string
  userId: string
  createdAt: string
  updatedAt: string
  user?: { id: string; name: string; avatar?: string | null; institution?: string | null }
  _count: { votes: number }
}

export const api = {
  register(name: string, email: string, password: string, studentId?: string, institution?: string, year?: string) {
    return request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, studentId, institution, year }),
    })
  },

  login(email: string, password: string) {
    return request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  getMe() {
    return request<User>('/auth/me')
  },

  getProfile() {
    return request<User>('/user/profile')
  },

  updateProfile(data: Partial<User>) {
    return request<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  getProjects(params?: { page?: number; limit?: number; sort?: string; field?: string; type?: string; year?: string; tag?: string; search?: string }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.sort) q.set('sort', params.sort)
    if (params?.field) q.set('field', params.field)
    if (params?.type) q.set('type', params.type)
    if (params?.year) q.set('year', params.year)
    if (params?.tag) q.set('tag', params.tag)
    if (params?.search) q.set('search', params.search)
    return request<{ projects: Project[]; total: number; page: number; totalPages: number }>(`/projects?${q}`)
  },

  getProject(id: string) {
    return request<Project>(`/projects/${id}`)
  },

  createProject(data: Partial<Project>) {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateProject(id: string, data: Partial<Project>) {
    return request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteProject(id: string) {
    return request<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' })
  },

  toggleVote(projectId: string) {
    return request<{ voted: boolean }>('/projects/vote', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    })
  },

  getSuggestions(q: string) {
    return request<{ titles: string[]; tags: string[]; studentNames: string[]; fields: string[] }>(`/projects/suggestions?q=${encodeURIComponent(q)}`)
  },
}
