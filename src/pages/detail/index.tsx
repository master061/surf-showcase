import { View, Text, Image, Button, Navigator } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { api, type Project } from '../../api'
import { useAuth } from '../../components/AuthStore'

const typeLabels: Record<string, string> = { INDIVIDUAL: '个人项目', TEAM: '团队项目', CLASS: '班级项目' }

export default function Detail() {
  const { id } = Taro.getCurrentInstance()?.router?.params as { id: string } || { id: '' }
  const { user, isLoggedIn, checkLogin } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [voted, setVoted] = useState(false)
  const [voteCount, setVoteCount] = useState(0)

  useEffect(() => {
    if (!id) return
    api.getProject(id).then(p => {
      setProject(p)
      setVoteCount(p._count.votes)
    }).catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
      .finally(() => setLoading(false))
  }, [id])

  const toggleVote = async () => {
    if (!checkLogin()) return
    try {
      const res = await api.toggleVote(id)
      setVoted(res.voted)
      setVoteCount(prev => res.voted ? prev + 1 : prev - 1)
    } catch { Taro.showToast({ title: '操作失败', icon: 'none' }) }
  }

  if (loading) return <View style={{ padding: 20 }}>{[1, 2, 3, 4].map(i => <View key={i} className="card skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 12 }} />)}</View>
  if (!project) return <View className="empty-state"><Text className="empty-state-icon">😕</Text><Text className="empty-state-text">项目不存在</Text></View>

  const tags = project.tags ? project.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const isOwner = user?.id === project.userId

  return (
    <View style={{ padding: '0 0 24px' }}>
      {/* Thumbnail */}
      {project.thumbnail && <Image src={project.thumbnail} style={{ width: '100%', height: 200 }} mode="aspectFill" />}

      <View style={{ padding: '0 16px' }}>
        {/* Badges */}
        <View className="flex gap-2" style={{ marginTop: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          <Text className="badge badge-blue">{project.field}</Text>
          {project.year && <Text className="badge badge-gray">{project.year}</Text>}
          <Text className="badge badge-green">{typeLabels[project.type] || project.type}</Text>
        </View>

        {/* Title */}
        <Text style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.4, marginBottom: 16 }}>{project.title}</Text>

        {/* Author */}
        <View className="card flex items-center gap-3" style={{ borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <Text style={{ width: 40, height: 40, borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {project.studentName?.[0]}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{project.studentName}</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>{project.institution}</Text>
          </View>
          <View className="flex items-center gap-1" onClick={toggleVote}>
            <Text style={{ fontSize: 18 }}>{voted ? '❤️' : '🤍'}</Text>
            <Text style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>{voteCount}</Text>
          </View>
        </View>

        {/* Abstract */}
        <View className="card" style={{ borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>摘要</Text>
          <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>{project.abstract}</Text>
        </View>

        {/* Content */}
        <View className="card" style={{ borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>详细介绍</Text>
          <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{project.content}</Text>
        </View>

        {/* Tags */}
        {tags.length > 0 && (
          <View className="card" style={{ borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>标签</Text>
            <View className="flex flex-wrap gap-1">{tags.map(t => <Text key={t} className="badge badge-gray">{t}</Text>)}</View>
          </View>
        )}

        {/* Owner actions */}
        {isOwner && (
          <View className="flex gap-2">
            <Navigator url={`/pages/edit/index?id=${project.id}`} className="btn btn-outline btn-block" style={{ borderRadius: 10, padding: 12, fontSize: 14 }}>编辑项目</Navigator>
            <Button className="btn btn-block" style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: 12, fontSize: 14 }} onClick={async () => {
              Taro.showModal({ title: '确认删除', content: '确定要删除此项目吗？', success: async (r) => {
                if (r.confirm) { try { await api.deleteProject(id); Taro.showToast({ title: '删除成功', icon: 'success' }); Taro.navigateBack() } catch { Taro.showToast({ title: '删除失败', icon: 'none' }) } }
              } })
            }}>删除</Button>
          </View>
        )}
      </View>
    </View>
  )
}
