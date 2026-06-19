import { View, Text, Navigator, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { api, type Project } from '../../api'
import { useAuth } from '../../components/AuthStore'

export default function Dashboard() {
  const { user, checkLogin, logout } = useAuth()
  const [list, setList] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!checkLogin()) return
    api.getProjects({ sort: 'newest' }).then(d => setList(d.projects.filter(p => p.userId === user?.id))).finally(() => setLoading(false))
  }, [])

  if (loading) return <View style={{ padding: '20px 16px' }}>{[1, 2, 3].map(i => <View key={i} className="card skeleton" style={{ height: 100, borderRadius: 12, marginBottom: 12 }} />)}</View>

  return (
    <View style={{ padding: '12px 16px' }}>
      {/* Profile card */}
      <View className="card" style={{ borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <View className="flex items-center" style={{ gap: 14 }}>
          {user?.avatar
            ? <Image src={user.avatar} style={{ width: 56, height: 56, borderRadius: 28 }} mode="aspectFill" />
            : <View style={{ width: 56, height: 56, borderRadius: 28, background: 'linear-gradient(135deg,#1e40af,#3730a3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>{user?.name?.[0]}</Text>
            </View>}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View className="flex items-center" style={{ gap: 8 }}>
              <Text style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{user?.name}</Text>
              <Text className="badge" style={{ background: user?.role === 'ADMIN' ? '#fefce8' : '#f0fdf4', color: user?.role === 'ADMIN' ? '#a16207' : '#15803d', fontSize: 10 }}>{user?.role === 'ADMIN' ? '管理员' : '学生'}</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{user?.email}</Text>
            {user?.institution && <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{user.institution}{user?.studentId ? ` | ${user.studentId}` : ''}</Text>}
            {user?.bio && <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 1.5 }} className="line-clamp-2">{user.bio}</Text>}
          </View>
          <Navigator url="/pages/profile/index" style={{ fontSize: 12, color: '#1e40af', padding: '6px 12px', border: '1px solid #1e40af', borderRadius: 8, whiteSpace: 'nowrap' }}>编辑</Navigator>
        </View>
      </View>

      {/* Stats */}
      <View className="card" style={{ borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <View className="flex items-center justify-between">
          <View className="text-center" style={{ flex: 1 }}><Text style={{ fontSize: 20, fontWeight: 700, color: '#1e40af', display: 'block' }}>{list.length}</Text><Text style={{ fontSize: 11, color: '#9ca3af' }}>我的项目</Text></View>
          <View style={{ width: 1, height: 28, background: '#e5e7eb' }} />
          <View className="text-center" style={{ flex: 1 }}><Text style={{ fontSize: 20, fontWeight: 700, color: '#1e40af', display: 'block' }}>{list.reduce((s, p) => s + p._count.votes, 0)}</Text><Text style={{ fontSize: 11, color: '#9ca3af' }}>总获票</Text></View>
          <View style={{ width: 1, height: 28, background: '#e5e7eb' }} />
          <View className="text-center" style={{ flex: 1 }}><Text style={{ fontSize: 20, fontWeight: 700, color: '#1e40af', display: 'block' }}>{user?.year || '-'}</Text><Text style={{ fontSize: 11, color: '#9ca3af' }}>入学年份</Text></View>
        </View>
      </View>

      {/* Projects */}
      <View className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>我的项目</Text>
        <Navigator url="/pages/create/index" className="btn btn-primary btn-sm" style={{ borderRadius: 8 }}>+ 发布</Navigator>
      </View>

      {list.length === 0 ? (
        <View className="empty-state" style={{ background: '#fff', borderRadius: 12 }}>
          <Text className="empty-state-icon">📭</Text>
          <Text className="empty-state-text">还没有发布任何项目</Text>
          <Navigator url="/pages/create/index" className="btn btn-primary btn-sm">发布第一个项目</Navigator>
        </View>
      ) : list.map(p => (
        <View className="card" key={p.id} style={{ borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <View className="flex items-center justify-between">
            <View style={{ flex: 1, minWidth: 0 }}>
              <Navigator url={`/pages/detail/index?id=${p.id}`} style={{ fontSize: 15, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 4 }}>{p.title}</Navigator>
              <View className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
                <Text className="badge badge-blue" style={{ fontSize: 10 }}>{p.field}</Text>
                {p.year && <Text className="badge badge-gray" style={{ fontSize: 10 }}>{p.year}</Text>}
                <Text style={{ fontSize: 11, color: '#f59e0b' }}>★ {p._count.votes}</Text>
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>{p.createdAt?.split('T')[0]}</Text>
              </View>
            </View>
            <View className="flex" style={{ gap: 6, marginLeft: 12, flexShrink: 0 }}>
              <Navigator url={`/pages/edit/index?id=${p.id}`} className="btn-outline btn-sm" style={{ borderRadius: 6, padding: '5px 10px', fontSize: 11 }}>编辑</Navigator>
              <Navigator url={`/pages/detail/index?id=${p.id}`} className="btn btn-primary btn-sm" style={{ borderRadius: 6, padding: '5px 10px', fontSize: 11 }}>查看</Navigator>
            </View>
          </View>
        </View>
      ))}

      {/* Logout */}
      <View style={{ marginTop: 24, textAlign: 'center' }}>
        <Text style={{ fontSize: 13, color: '#dc2626' }} onClick={() => Taro.showModal({ title: '提示', content: '确定退出登录？', success: (r) => { if (r.confirm) logout() } })}>退出登录</Text>
      </View>
    </View>
  )
}
