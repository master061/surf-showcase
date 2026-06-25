import { View, Text, Navigator, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { api, type Project } from '../../api'
import { useAuth } from '../../components/AuthStore'

export default function Dashboard() {
  const { user, checkLogin, logout } = useAuth()
  const [list, setList] = useState<Project[]>([])
  const [favList, setFavList] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    if (!checkLogin()) return
    Promise.all([
      api.getProjects({ sort: 'newest' }),
      api.getProjects({ favorites: true as any }),
    ]).then(([d, fav]) => {
      setList(d.projects.filter(p => p.userId === user?.id))
      setFavList(fav.projects)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  // Refresh when switching back to this tab
  // Note: useDidShow is injected into Taro by the framework plugin
  Taro.useDidShow(() => {
    fetchData()
  })

  if (loading) return <View style={{ padding: '20px 16px' }}>{[1, 2, 3].map(i => <View key={i} className="card skeleton" style={{ height: 100, borderRadius: 12, marginBottom: 12 }} />)}</View>

  return (
    <View style={{ paddingBottom: 24 }}>
      {/* Profile card */}
      <View style={{ padding: '12px 16px 0' }}>
        <View className="card" style={{ borderRadius: 16, padding: 20, background: 'linear-gradient(135deg,#fff,#f8faff)' }}>
          <View className="flex items-center" style={{ gap: 14 }}>
            {user?.avatar
              ? <Image src={user.avatar} style={{ width: 60, height: 60, borderRadius: 30, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} mode="aspectFill" />
              : <View style={{ width: 60, height: 60, borderRadius: 30, background: 'linear-gradient(135deg,#1e40af,#3730a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(30,64,175,0.3)' }}>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{user?.name?.[0]}</Text>
              </View>}
            <View style={{ flex: 1, minWidth: 0 }}>
              <View className="flex items-center" style={{ gap: 8 }}>
                <Text style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{user?.name}</Text>
                <Text className="badge" style={{ background: user?.role === 'ADMIN' ? '#fefce8' : '#f0fdf4', color: user?.role === 'ADMIN' ? '#a16207' : '#15803d', fontSize: 10 }}>{user?.role === 'ADMIN' ? '管理员' : '学生'}</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{user?.email}</Text>
              {user?.institution && <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{user.institution}{user?.studentId ? ` | ${user.studentId}` : ''}</Text>}
            </View>
            <Navigator url="/pages/profile/index" className="btn btn-outline btn-sm" style={{ borderRadius: 8, flexShrink: 0 }}>编辑资料</Navigator>
          </View>
          {user?.bio && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
              <Text style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{user.bio}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={{ padding: '12px 16px 0' }}>
        <View className="card" style={{ borderRadius: 14, padding: 14 }}>
          <View className="flex items-center justify-between">
            <View className="text-center" style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: 800, color: '#1e40af', display: 'block', fontFeatureSettings: '"tnum"', letterSpacing: -0.5 }}>{list.length}</Text>
              <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>我的项目</Text>
            </View>
            <View style={{ width: 1, height: 28, background: '#e5e7eb' }} />
            <View className="text-center" style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: 800, color: '#f97316', display: 'block', fontFeatureSettings: '"tnum"', letterSpacing: -0.5 }}>{list.reduce((s, p) => s + p._count.votes, 0)}</Text>
              <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>总获票</Text>
            </View>
            <View style={{ width: 1, height: 28, background: '#e5e7eb' }} />
            <View className="text-center" style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: 800, color: '#10b981', display: 'block', fontFeatureSettings: '"tnum"', letterSpacing: -0.5 }}>{user?.year || '-'}</Text>
              <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>入学年份</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Projects */}
      <View style={{ padding: '16px 16px 0' }}>
        <View className="section-header">
          <Text className="section-title">我的项目</Text>
          <Navigator url="/pages/create/index" className="btn btn-primary btn-sm" style={{ borderRadius: 8, boxShadow: '0 2px 6px rgba(30,64,175,0.25)' }}>+ 发布</Navigator>
        </View>

        {list.length === 0 ? (
          <View className="card empty-state" style={{ borderRadius: 16 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 32 }}>📝</Text>
            </View>
            <Text className="empty-state-text" style={{ marginBottom: 4 }}>还没有发布任何项目</Text>
            <Text style={{ fontSize: 12, color: '#d1d5db', marginBottom: 16 }}>分享你的科研成果，让更多人看到</Text>
            <Navigator url="/pages/create/index" className="btn btn-primary btn-sm">发布第一个项目</Navigator>
          </View>
        ) : list.map(p => (
          <View className="card card-clickable" key={p.id} style={{ borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: '3px solid #3b82f6' }}>
            <View className="flex items-start justify-between">
              <View style={{ flex: 1, minWidth: 0 }}>
                <Navigator url={`/pages/detail/index?id=${p.id}`} style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6, lineHeight: 1.4 }}>{p.title}</Navigator>
                <View className="flex flex-wrap items-center" style={{ gap: 6 }}>
                  <Text className="badge badge-blue" style={{ fontSize: 10 }}>{p.field}</Text>
                  {p.year && <Text className="badge badge-gray" style={{ fontSize: 10 }}>{p.year}</Text>}
                  <View className="flex items-center" style={{ gap: 2 }}>
                    <Text style={{ fontSize: 11, color: '#f59e0b' }}>★</Text>
                    <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{p._count.votes}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#d1d5db' }}>|</Text>
                  <Text style={{ fontSize: 10, color: '#9ca3af' }}>{p.createdAt?.split('T')[0]}</Text>
                </View>
              </View>
              <View className="flex" style={{ gap: 6, marginLeft: 12, flexShrink: 0 }}>
                <Navigator url={`/pages/edit/index?id=${p.id}`} className="btn btn-outline btn-xs" style={{ borderRadius: 6 }}>编辑</Navigator>
                <Navigator url={`/pages/detail/index?id=${p.id}`} className="btn btn-primary btn-xs" style={{ borderRadius: 6 }}>查看</Navigator>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Favorites */}
      <View style={{ padding: '0 16px', marginTop: 4 }}>
        <View className="section-header" style={{ marginBottom: 12 }}>
          <Text className="section-title">⭐ 我的收藏</Text>
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>{favList.length} 个项目</Text>
        </View>
        {favList.length > 0 ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {favList.map(p => (
              <Navigator key={p.id} url={`/pages/detail/index?id=${p.id}`}>
                <View className="card card-clickable" style={{ borderRadius: 12, padding: 12, borderLeft: '3px solid #f59e0b', background: 'linear-gradient(135deg,#fff,#fffdf5)' }}>
                  <View className="flex items-start justify-between">
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 4, lineHeight: 1.3 }}>{p.title}</Text>
                      <View className="flex flex-wrap items-center" style={{ gap: 6 }}>
                        <Text className="badge badge-blue" style={{ fontSize: 10 }}>{p.field}</Text>
                        <Text style={{ fontSize: 11, color: '#9ca3af' }}>{p.studentName} · {p.institution}</Text>
                        <View className="flex items-center" style={{ gap: 2 }}>
                          <Text style={{ fontSize: 11, color: '#f59e0b' }}>★</Text>
                          <Text style={{ fontSize: 11, color: '#6b7280' }}>{p._count.votes}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={{ fontSize: 18, flexShrink: 0, marginLeft: 10 }}>⭐</Text>
                  </View>
                </View>
              </Navigator>
            ))}
          </View>
        ) : (
          <View className="card" style={{ borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <Text style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>⭐</Text>
            <Text style={{ fontSize: 13, color: '#9ca3af', display: 'block', marginBottom: 12 }}>还没有收藏任何项目</Text>
            <Navigator openType="switchTab" url="/pages/projects/index" className="btn btn-outline btn-sm" style={{ borderRadius: 8 }}>去发现好项目</Navigator>
          </View>
        )}
      </View>

      {/* Logout */}
      <View style={{ marginTop: 28, textAlign: 'center', paddingBottom: 12 }}>
        <Text style={{ fontSize: 13, color: '#d1d5db' }} onClick={() => Taro.showModal({ title: '提示', content: '确定退出登录？', success: (r) => { if (r.confirm) logout() } })}>退出登录</Text>
      </View>
    </View>
  )
}
