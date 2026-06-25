import { View, Text, Image, Button, Navigator } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { api, type Project } from '../../api'
import { useAuth } from '../../components/AuthStore'

const typeLabels: Record<string, string> = { INDIVIDUAL: '个人项目', TEAM: '团队项目', CLASS: '班级项目' }
const typeBgColors: Record<string, string> = { INDIVIDUAL: '#f0fdf4', TEAM: '#f5f3ff', CLASS: '#eff6ff' }
const typeColors: Record<string, string> = { INDIVIDUAL: '#15803d', TEAM: '#7c3aed', CLASS: '#1d4ed8' }

export default function Detail() {
  const { id } = Taro.getCurrentInstance()?.router?.params as { id: string } || { id: '' }
  const { user, isLoggedIn, checkLogin } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [voted, setVoted] = useState(false)
  const [voteCount, setVoteCount] = useState(0)
  const [heartAnim, setHeartAnim] = useState(false)
  const [favorited, setFavorited] = useState(false)

  useEffect(() => {
    if (!id) return
    api.getProject(id).then((p: any) => {
      setProject(p)
      setVoteCount(p._count.votes)
      setVoted(p.hasVoted || false)
      setFavorited(p.hasFavorited || false)
    }).catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
      .finally(() => setLoading(false))
  }, [id])

  const toggleFavorite = async () => {
    if (!checkLogin()) return
    try {
      const res = await api.toggleFavorite(id)
      setFavorited(res.favorited)
      Taro.setStorageSync('favChanged', Date.now())
      Taro.showToast({ title: res.favorited ? '已收藏' : '已取消收藏', icon: 'success' })
    } catch { Taro.showToast({ title: '操作失败', icon: 'none' }) }
  }

  const toggleVote = async () => {
    if (!checkLogin()) return
    try {
      const res = await api.toggleVote(id)
      setVoted(res.voted)
      setVoteCount(prev => res.voted ? prev + 1 : prev - 1)
      if (res.voted) {
        setHeartAnim(true)
        setTimeout(() => setHeartAnim(false), 600)
      }
    } catch { Taro.showToast({ title: '操作失败', icon: 'none' }) }
  }

  if (loading) return <View style={{ padding: 20 }}>{[1, 2, 3, 4].map(i => <View key={i} className="card skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 12 }} />)}</View>
  if (!project) return <View className="empty-state"><View style={{ width: 72, height: 72, borderRadius: 36, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Text style={{ fontSize: 32 }}>🔍</Text></View><Text className="empty-state-text">项目不存在</Text></View>

  const tags = project.tags ? project.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const galleryImages = (() => { try { return JSON.parse(project.images || '[]') as string[] } catch { return [] } })()
  const isOwner = user?.id === project.userId

  const previewImages = (current: string) => {
    const all = project.thumbnail ? [project.thumbnail, ...galleryImages.filter(u => u !== project.thumbnail)] : galleryImages
    Taro.previewImage({ current, urls: all })
  }

  return (
    <View style={{ paddingBottom: 24 }}>
      {/* Header image */}
      {project.thumbnail ? (
        <View style={{ position: 'relative' }}>
          <Image src={project.thumbnail} style={{ width: '100%', height: 220 }} mode="aspectFill" onClick={() => previewImages(project.thumbnail!)} />
          {galleryImages.length > 1 && (
            <View style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: '4px 10px' }}>
              <Text style={{ color: '#fff', fontSize: 11 }}>{galleryImages.length} 张图片</Text>
            </View>
          )}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }} />
        </View>
      ) : (
        <View style={{ width: '100%', height: 120, background: 'linear-gradient(135deg,#1e40af,#3730a3)', display: 'flex', alignItems: 'flex-end', padding: '20px 16px' }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>SURF 科研项目</Text>
        </View>
      )}

      {/* Image gallery */}
      {galleryImages.length > 1 && (
        <View style={{ marginTop: -1 }}>
          <View style={{ display: 'flex', flexDirection: 'row', overflowX: 'scroll', padding: '8px 12px', gap: 8 }}>
            {galleryImages.map((url, i) => (
              <Image
                key={i}
                src={url}
                style={{ width: 80, height: 80, borderRadius: 8, flexShrink: 0, border: url === project.thumbnail ? '2px solid #1e40af' : '1px solid #e5e7eb' }}
                mode="aspectFill"
                onClick={() => previewImages(url)}
              />
            ))}
          </View>
        </View>
      )}

      <View style={{ padding: '0 16px' }}>
        {/* Badges */}
        <View className="flex flex-wrap" style={{ gap: 6, marginTop: 16, marginBottom: 12 }}>
          <Text className="badge badge-blue">{project.field}</Text>
          {project.year && <Text className="badge badge-gray">{project.year}</Text>}
          <Text className="badge" style={{ background: typeBgColors[project.type] || '#f0fdf4', color: typeColors[project.type] || '#15803d' }}>{typeLabels[project.type] || project.type}</Text>
        </View>

        {/* Title */}
        <Text style={{ fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1.35, marginBottom: 16, display: 'block' }}>{project.title}</Text>

        {/* Vote button - prominent CTA */}
        <View
          className="card card-clickable"
          style={{
            borderRadius: 14,
            padding: 0,
            marginBottom: 16,
            overflow: 'hidden',
            border: voted ? '2px solid #fecaca' : '2px solid transparent',
          }}
          onClick={toggleVote}
        >
          <View style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 16px',
            background: voted ? '#fff5f5' : '#fafafa',
            gap: 10,
          }}>
            <Text style={{
              fontSize: 28,
              display: 'inline-block',
              transition: 'transform 0.3s',
              transform: heartAnim ? 'scale(1.4)' : 'scale(1)',
            }}>{voted ? '❤️' : '🤍'}</Text>
            <View>
              <Text style={{ fontSize: 15, fontWeight: 700, color: voted ? '#dc2626' : '#374151', display: 'block' }}>
                {voted ? '已点赞支持' : '点赞支持'}
              </Text>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                {voted ? '感谢你的支持！' : `${voteCount} 人已点赞`}
              </Text>
            </View>
          </View>
        </View>

        {/* Star / Favorite */}
        <View
          className="card card-clickable"
          style={{ borderRadius: 14, padding: 0, marginBottom: 12, overflow: 'hidden', border: favorited ? '2px solid #fde68a' : '2px solid transparent' }}
          onClick={toggleFavorite}
        >
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', background: favorited ? '#fffbeb' : '#fafafa', gap: 8 }}>
            <Text style={{ fontSize: 22 }}>{favorited ? '⭐' : '☆'}</Text>
            <View>
              <Text style={{ fontSize: 14, fontWeight: 700, color: favorited ? '#d97706' : '#374151', display: 'block' }}>
                {favorited ? '已收藏' : '收藏项目'}
              </Text>
              <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                {favorited ? '在个人中心查看收藏' : '收藏后随时查看'}
              </Text>
            </View>
          </View>
        </View>

        {/* Author card */}
        <View className="card" style={{ borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <View className="flex items-center" style={{ gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, background: 'linear-gradient(135deg,#1e40af,#3730a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{project.studentName?.[0]}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'block' }}>{project.studentName}</Text>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>{project.institution}</Text>
            </View>
            <View style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 16 }}>★</Text>
              <Text style={{ fontSize: 14, fontWeight: 700, color: '#f97316' }}>{voteCount}</Text>
            </View>
          </View>
        </View>

        {/* Recruiting card */}
        {project.isRecruiting && (
          <View className="card" style={{ borderRadius: 14, padding: 16, marginBottom: 12, borderLeft: '3px solid #dc2626', background: 'linear-gradient(135deg,#fff,#fff5f5)' }}>
            <View className="flex items-center" style={{ gap: 8, marginBottom: project.recruitingInfo ? 10 : 0 }}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', display: 'block' }}>正在招募团队成员</Text>
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>该项目正在寻找志同道合的伙伴加入</Text>
              </View>
            </View>
            {project.recruitingInfo && (
              <View style={{ borderTop: '1px solid #fecaca', paddingTop: 10 }}>
                <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{project.recruitingInfo}</Text>
              </View>
            )}
          </View>
        )}

        {/* Abstract */}
        <View className="card" style={{ borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 8, display: 'block' }}>📄 摘要</Text>
          <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.75 }}>{project.abstract}</Text>
        </View>

        {/* Content */}
        <View className="card" style={{ borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 8, display: 'block' }}>📖 详细介绍</Text>
          <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{project.content}</Text>
        </View>

        {/* Methods */}
        {project.methods && (
          <View className="card" style={{ borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 8, display: 'block' }}>🔬 研究方法</Text>
            <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{project.methods}</Text>
          </View>
        )}

        {/* Results */}
        {project.results && (
          <View className="card" style={{ borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 8, display: 'block' }}>🏆 项目成果</Text>
            <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{project.results}</Text>
          </View>
        )}

        {/* References */}
        {project.references && (
          <View className="card" style={{ borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 8, display: 'block' }}>📚 参考文献</Text>
            <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{project.references}</Text>
          </View>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <View className="card" style={{ borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 10, display: 'block' }}>🏷️ 标签</Text>
            <View className="flex flex-wrap" style={{ gap: 6 }}>
              {tags.map(t => (
                <View key={t} className="tag-chip">{t}</View>
              ))}
            </View>
          </View>
        )}

        {/* Owner actions */}
        {isOwner && (
          <View style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Navigator url={`/pages/edit/index?id=${project.id}`} className="btn btn-outline btn-block" style={{ borderRadius: 12, padding: 12, fontSize: 14, flex: 1 }}>编辑项目</Navigator>
            <Button className="btn btn-danger btn-block" style={{ borderRadius: 12, padding: 12, fontSize: 14, flex: 1 }} onClick={async () => {
              Taro.showModal({ title: '确认删除', content: '确定要删除此项目吗？此操作不可撤销。', success: async (r) => {
                if (r.confirm) { try { await api.deleteProject(id); Taro.showToast({ title: '删除成功', icon: 'success' }); Taro.navigateBack() } catch { Taro.showToast({ title: '删除失败', icon: 'none' }) } }
              } })
            }}>删除</Button>
          </View>
        )}
      </View>
    </View>
  )
}
