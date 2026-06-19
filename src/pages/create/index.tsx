import { View, Text, Input, Textarea, Picker, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { useAuth } from '../../components/AuthStore'
import { api } from '../../api'

const fields = ['计算机科学', '人工智能', '生物医药', '物理数学', '化学材料', '工程技术', '社会科学', '人文艺术']
const years = ['2023', '2024', '2025', '2026']
const types = ['个人项目', '团队项目', '班级项目']
const typeValues = ['INDIVIDUAL', 'TEAM', 'CLASS']

export default function Create() {
  const { user, checkLogin } = useAuth()
  const [f, setF] = useState({ title: '', abstract: '', content: '', field: 0, tags: '', thumbnail: '', studentName: user?.name || '', institution: user?.institution || '', year: 2, type: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const h = (k: string, v: string | number) => setF(p => ({ ...p, [k]: v }))
  const submit = async () => {
    if (!checkLogin()) return
    if (!f.title || !f.abstract || !f.content) { setError('请填写必填项'); return }
    setLoading(true)
    setError('')
    try {
      const d = await api.createProject({
        title: f.title, abstract: f.abstract, content: f.content,
        field: fields[f.field], tags: f.tags,
        thumbnail: f.thumbnail || undefined,
        studentName: f.studentName, institution: f.institution,
        year: years[f.year], type: typeValues[f.type],
      })
      Taro.redirectTo({ url: `/pages/detail/index?id=${d.id}` })
    } catch { setError('发布失败') } finally { setLoading(false) }
  }

  return (
    <View style={{ padding: '12px 16px' }}>
      <Text style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16 }}>发布科研项目</Text>
      <View className="card" style={{ borderRadius: 12, padding: 20 }}>
        {error && <View style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</View>}
        <View className="input-group"><Text className="input-label">标题 *</Text><Input value={f.title} onInput={e => h('title', e.detail.value)} placeholder="输入项目标题" className="input" /></View>
        <View className="input-group"><Text className="input-label">领域 *</Text><Picker mode="selector" range={fields} value={f.field} onChange={e => h('field', Number(e.detail.value))}><View className="input">{fields[f.field]}</View></Picker></View>
        <View className="input-group"><Text className="input-label">姓名 *</Text><Input value={f.studentName} onInput={e => h('studentName', e.detail.value)} className="input" placeholder="你的姓名" /></View>
        <View className="input-group"><Text className="input-label">学校/院系 *</Text><Input value={f.institution} onInput={e => h('institution', e.detail.value)} className="input" placeholder="计算机科学与技术学院" /></View>
        <View className="input-group"><Text className="input-label">项目年份</Text><Picker mode="selector" range={years} value={f.year} onChange={e => h('year', Number(e.detail.value))}><View className="input">{years[f.year]}</View></Picker></View>
        <View className="input-group"><Text className="input-label">项目类型</Text><Picker mode="selector" range={types} value={f.type} onChange={e => h('type', Number(e.detail.value))}><View className="input">{types[f.type]}</View></Picker></View>
        <View className="input-group"><Text className="input-label">摘要 *</Text><Textarea value={f.abstract} onInput={e => h('abstract', e.detail.value)} className="input" placeholder="简要描述你的项目..." style={{ minHeight: 72, lineHeight: 1.6 }} /></View>
        <View className="input-group"><Text className="input-label">详细介绍 *</Text><Textarea value={f.content} onInput={e => h('content', e.detail.value)} className="input" placeholder="详细描述你的项目内容、方法、成果..." style={{ minHeight: 140, lineHeight: 1.6 }} /></View>
        <View className="input-group"><Text className="input-label">封面图 URL</Text><Input value={f.thumbnail} onInput={e => h('thumbnail', e.detail.value)} className="input" placeholder="https://example.com/image.jpg" /></View>
        <View className="input-group"><Text className="input-label">标签（逗号分隔）</Text><Input value={f.tags} onInput={e => h('tags', e.detail.value)} className="input" placeholder="例如：机器学习, 计算机视觉, Python" /></View>
        <Button className="btn btn-primary btn-block" style={{ marginTop: 12, borderRadius: 10, padding: 12, fontSize: 15 }} loading={loading} onClick={submit}>发布项目</Button>
      </View>
    </View>
  )
}
