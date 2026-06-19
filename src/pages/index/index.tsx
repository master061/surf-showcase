import { View, Text, Navigator, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { api, type Project } from '../../api'
import { useAuth } from '../../components/AuthStore'
import ProjectCard from '../../components/ProjectCard'

const fields = ['计算机科学', '人工智能', '生物医药', '物理数学', '化学材料', '工程技术', '社会科学', '人文艺术']
const fieldColors = ['#eff6ff', '#f0fdf4', '#fef2f2', '#f5f3ff', '#fefce8', '#fff7ed', '#ecfeff', '#fdf2f8']
const fieldIcons = ['💻', '🤖', '🧬', '📐', '🧪', '⚙️', '📊', '🎨']

export default function Index() {
  const { user, isLoggedIn } = useAuth()
  const [hotProjects, setHotProjects] = useState<Project[]>([])
  const [latestProjects, setLatestProjects] = useState<Project[]>([])
  const [stats, setStats] = useState({ projects: 0, fields: 0, users: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getProjects({ sort: 'hot', limit: 5 }),
      api.getProjects({ sort: 'newest', limit: 5 }),
    ]).then(([hot, latest]) => {
      setHotProjects(hot.projects)
      setLatestProjects(latest.projects)
      setStats({ projects: hot.total, fields: fields.length, users: 0 })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <View style={{ padding: '20px 16px' }}>
        {[1, 2, 3].map(i => <View key={i} className="card skeleton" style={{ height: 100, borderRadius: 12, marginBottom: 12 }} />)}
      </View>
    )
  }

  return (
    <View style={{ padding: '0 0 12px' }}>
      {/* Hero */}
      <View style={{ background: 'linear-gradient(135deg,#1e40af,#3730a3)', padding: '32px 20px 28px' }}>
        <Text style={{ fontSize: 26, fontWeight: 700, color: '#fff', display: 'block' }}>SURF 科研展示</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.6 }}>
          展示 Summer Undergraduate Research Fellowship 优秀科研成果
        </Text>
        <View style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <Navigator url="/pages/projects/index" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, flex: 1, textAlign: 'center' }}>浏览项目</Navigator>
          {isLoggedIn ? (
            <Navigator url="/pages/create/index" className="btn" style={{ background: '#fff', color: '#1e40af', borderRadius: 8, padding: '8px 16px', fontSize: 13, flex: 1, textAlign: 'center' }}>发布项目</Navigator>
          ) : (
            <Navigator url="/pages/auth/login" className="btn" style={{ background: '#fff', color: '#1e40af', borderRadius: 8, padding: '8px 16px', fontSize: 13, flex: 1, textAlign: 'center' }}>登录</Navigator>
          )}
        </View>
      </View>

      {/* Stats */}
      <View className="card" style={{ margin: '-14px 16px 16px', borderRadius: 12, padding: 14, position: 'relative', zIndex: 1 }}>
        <View className="flex items-center justify-between">
          <View className="text-center" style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: '#1e40af', display: 'block' }}>{stats.projects}</Text>
            <Text style={{ fontSize: 11, color: '#9ca3af' }}>项目总数</Text>
          </View>
          <View style={{ width: 1, height: 28, background: '#e5e7eb' }} />
          <View className="text-center" style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: '#1e40af', display: 'block' }}>{stats.fields}</Text>
            <Text style={{ fontSize: 11, color: '#9ca3af' }}>研究领域</Text>
          </View>
          <View style={{ width: 1, height: 28, background: '#e5e7eb' }} />
          <View className="text-center" style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: '#1e40af', display: 'block' }}>{isLoggedIn ? user?.name?.[0] || '-' : '-'}</Text>
            <Text style={{ fontSize: 11, color: '#9ca3af' }}>{isLoggedIn ? '已登录' : '未登录'}</Text>
          </View>
        </View>
      </View>

      {/* Fields Grid */}
      <View style={{ padding: '0 16px', marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12 }}>研究领域</Text>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {fields.map((f, i) => (
            <Navigator key={f} url={`/pages/projects/index?field=${f}`} style={{ width: '23%', background: fieldColors[i], borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}>
              <Text style={{ fontSize: 20, display: 'block' }}>{fieldIcons[i]}</Text>
              <Text style={{ fontSize: 11, color: '#374151', marginTop: 4 }}>{f}</Text>
            </Navigator>
          ))}
        </View>
      </View>

      {/* Hot Projects */}
      {hotProjects.length > 0 && (
        <View style={{ padding: '0 16px', marginBottom: 16 }}>
          <View className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>热门项目</Text>
            <Navigator url="/pages/projects/index?sort=hot" style={{ fontSize: 12, color: '#1e40af' }}>查看更多</Navigator>
          </View>
          {hotProjects.map(p => <ProjectCard key={p.id} project={p} />)}
        </View>
      )}

      {/* Latest Projects */}
      {latestProjects.length > 0 && (
        <View style={{ padding: '0 16px' }}>
          <View className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>最新发布</Text>
            <Navigator url="/pages/projects/index" style={{ fontSize: 12, color: '#1e40af' }}>查看更多</Navigator>
          </View>
          {latestProjects.map(p => <ProjectCard key={p.id} project={p} />)}
        </View>
      )}
    </View>
  )
}
