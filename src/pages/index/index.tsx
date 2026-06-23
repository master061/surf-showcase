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

  const totalVotes = [...hotProjects, ...latestProjects].reduce((sum, p, i, arr) => {
    if (arr.findIndex(x => x.id === p.id) !== i) return sum
    return sum + (p._count?.votes || 0)
  }, 0)

  const setProjectFilter = (filter: Record<string, string> | null) => {
    if (filter) Taro.setStorageSync('projectFilter', filter)
    else Taro.removeStorageSync('projectFilter')
  }

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
      <View style={{ position: 'relative', background: 'linear-gradient(135deg,#1e40af 0%,#3730a3 100%)', padding: '36px 20px 48px', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, background: 'rgba(255,255,255,0.04)', top: -100, right: -60 }} />
        <View style={{ position: 'absolute', width: 140, height: 140, borderRadius: 70, background: 'rgba(255,255,255,0.06)', top: 60, right: 40 }} />
        <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, background: 'rgba(255,255,255,0.05)', bottom: 10, left: -30 }} />
        {/* Grid dots pattern */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03 }}>
          {Array.from({ length: 6 }).map((_, r) => (
            Array.from({ length: 8 }).map((_, c) => (
              <View key={`${r}-${c}`} style={{ position: 'absolute', width: 3, height: 3, borderRadius: 1.5, background: '#fff', top: 20 + r * 40, left: 20 + c * 50 }} />
            ))
          ))}
        </View>
        <Text style={{ fontSize: 28, fontWeight: 800, color: '#fff', display: 'block', position: 'relative', zIndex: 1, letterSpacing: 1 }}>SURF 科研展示</Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, position: 'relative', zIndex: 1, letterSpacing: 0.5 }}>
          Summer Undergraduate Research Fellowship
        </Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 8, lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
          探索优秀本科生科研成果，发现前沿研究方向
        </Text>
        <View style={{ marginTop: 22, display: 'flex', gap: 10, position: 'relative', zIndex: 1 }}>
          <Navigator
            openType="switchTab"
            url="/pages/projects/index"
            onClick={() => setProjectFilter(null)}
            className="btn"
            style={{ background: 'transparent', color: '#fff', borderRadius: 10, padding: '10px 16px', fontSize: 13, flex: 1, textAlign: 'center', border: '1px solid rgba(255,255,255,0.35)' }}
          >浏览项目</Navigator>
          {isLoggedIn ? (
            <Navigator url="/pages/create/index" className="btn" style={{ background: '#fff', color: '#1e40af', borderRadius: 10, padding: '10px 16px', fontSize: 13, flex: 1, textAlign: 'center', fontWeight: 600 }}>发布项目</Navigator>
          ) : (
            <Navigator url="/pages/auth/login/index" className="btn" style={{ background: '#fff', color: '#1e40af', borderRadius: 10, padding: '10px 16px', fontSize: 13, flex: 1, textAlign: 'center', fontWeight: 600 }}>登录</Navigator>
          )}
        </View>
        {/* Bottom curve */}
        <View style={{ position: 'absolute', bottom: 0, left: -20, right: -20, height: 32, background: '#f3f4f6', borderRadius: '50% 50% 0 0' }} />
      </View>

      {/* Stats */}
      <View className="card" style={{ margin: '-18px 16px 16px', borderRadius: 16, padding: 16, position: 'relative', zIndex: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <View className="flex items-center justify-between">
          <View className="text-center" style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: 800, color: '#1e40af', display: 'block', fontFeatureSettings: '"tnum"', letterSpacing: -0.5 }}>{stats.projects}</Text>
            <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>项目总数</Text>
          </View>
          <View style={{ width: 1, height: 28, background: '#e5e7eb' }} />
          <View className="text-center" style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: 800, color: '#10b981', display: 'block', fontFeatureSettings: '"tnum"', letterSpacing: -0.5 }}>{stats.fields}</Text>
            <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>研究领域</Text>
          </View>
          <View style={{ width: 1, height: 28, background: '#e5e7eb' }} />
          <View className="text-center" style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: 800, color: '#f97316', display: 'block', fontFeatureSettings: '"tnum"', letterSpacing: -0.5 }}>{totalVotes}</Text>
            <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>累计获票</Text>
          </View>
        </View>
      </View>

      {/* Fields Grid */}
      <View style={{ padding: '0 16px', marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12 }}>研究领域</Text>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {fields.map((f, i) => (
            <Navigator
              key={f}
              openType="switchTab"
              url="/pages/projects/index"
              onClick={() => setProjectFilter({ field: f })}
              style={{ width: '23%', background: fieldColors[i], borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}
            >
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
            <Navigator
              openType="switchTab"
              url="/pages/projects/index"
              onClick={() => setProjectFilter({ sort: 'hot' })}
              style={{ fontSize: 12, color: '#1e40af' }}
            >查看更多</Navigator>
          </View>
          {hotProjects.map(p => <ProjectCard key={p.id} project={p} />)}
        </View>
      )}

      {/* Latest Projects */}
      {latestProjects.length > 0 && (
        <View style={{ padding: '0 16px' }}>
          <View className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>最新发布</Text>
            <Navigator
              openType="switchTab"
              url="/pages/projects/index"
              onClick={() => setProjectFilter(null)}
              style={{ fontSize: 12, color: '#1e40af' }}
            >查看更多</Navigator>
          </View>
          {latestProjects.map(p => <ProjectCard key={p.id} project={p} />)}
        </View>
      )}
    </View>
  )
}
