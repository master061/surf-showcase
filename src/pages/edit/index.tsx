import { View, Text, Input, Textarea, Picker, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { api } from '../../api'

const fields = ['计算机科学', '人工智能', '生物医药', '物理数学', '化学材料', '工程技术', '社会科学', '人文艺术']
const years = ['2023', '2024', '2025', '2026']
const types = ['个人项目', '团队项目', '班级项目']
const typeValues = ['INDIVIDUAL', 'TEAM', 'CLASS']

export default function Edit() {
  const { id } = Taro.getCurrentInstance()?.router?.params as { id: string } || { id: '' }
  const [f, setF] = useState({ title: '', abstract: '', content: '', field: 0, tags: '', thumbnail: '', studentName: '', institution: '', year: 2, type: 0 })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  const h = (k: string, v: string | number) => setF(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!id) return
    api.getProject(id).then(p => {
      setF({
        title: p.title, abstract: p.abstract, content: p.content,
        field: Math.max(0, fields.indexOf(p.field)),
        tags: p.tags, thumbnail: p.thumbnail || '',
        studentName: p.studentName, institution: p.institution,
        year: Math.max(0, years.indexOf(String(p.year || ''))),
        type: Math.max(0, typeValues.indexOf(p.type)),
      })
    }).catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
      .finally(() => setFetching(false))
  }, [id])

  const submit = async () => {
    if (!f.title || !f.abstract || !f.content) { setError('请填写必填项'); return }
    setLoading(true)
    setError('')
    try {
      await api.updateProject(id, {
        title: f.title, abstract: f.abstract, content: f.content,
        field: fields[f.field], tags: f.tags,
        thumbnail: f.thumbnail || undefined,
        studentName: f.studentName, institution: f.institution,
        year: years[f.year], type: typeValues[f.type],
      })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      Taro.navigateBack()
    } catch { setError('保存失败') } finally { setLoading(false) }
  }

  if (fetching) return <View style={{ padding: 20 }}>{[1, 2, 3].map(i => <View key={i} className="card skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 12 }} />)}</View>

  return (
    <View style={{ padding: '12px 16px' }}>
      <Text style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16 }}>编辑项目</Text>
      <View className="card" style={{ borderRadius: 12, padding: 20 }}>
        {error && <View style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</View>}
        <View className="input-group"><Text className="input-label">标题 *</Text><Input value={f.title} onInput={e => h('title', e.detail.value)} className="input" /></View>
        <View className="input-group"><Text className="input-label">领域 *</Text><Picker mode="selector" range={fields} value={f.field} onChange={e => h('field', Number(e.detail.value))}><View className="input">{fields[f.field]}</View></Picker></View>
        <View className="input-group"><Text className="input-label">姓名</Text><Input value={f.studentName} onInput={e => h('studentName', e.detail.value)} className="input" /></View>
        <View className="input-group"><Text className="input-label">学校/院系</Text><Input value={f.institution} onInput={e => h('institution', e.detail.value)} className="input" /></View>
        <View className="input-group"><Text className="input-label">项目年份</Text><Picker mode="selector" range={years} value={f.year} onChange={e => h('year', Number(e.detail.value))}><View className="input">{years[f.year]}</View></Picker></View>
        <View className="input-group"><Text className="input-label">项目类型</Text><Picker mode="selector" range={types} value={f.type} onChange={e => h('type', Number(e.detail.value))}><View className="input">{types[f.type]}</View></Picker></View>
        <View className="input-group"><Text className="input-label">摘要 *</Text><Textarea value={f.abstract} onInput={e => h('abstract', e.detail.value)} className="input" style={{ minHeight: 72, lineHeight: 1.6 }} /></View>
        <View className="input-group"><Text className="input-label">详细介绍 *</Text><Textarea value={f.content} onInput={e => h('content', e.detail.value)} className="input" style={{ minHeight: 140, lineHeight: 1.6 }} /></View>
        <View className="input-group"><Text className="input-label">封面图 URL</Text><Input value={f.thumbnail} onInput={e => h('thumbnail', e.detail.value)} className="input" /></View>
        <View className="input-group"><Text className="input-label">标签（逗号分隔）</Text><Input value={f.tags} onInput={e => h('tags', e.detail.value)} className="input" /></View>
        <Button className="btn btn-primary btn-block" style={{ marginTop: 12, borderRadius: 10, padding: 12, fontSize: 15 }} loading={loading} onClick={submit}>保存修改</Button>
      </View>
    </View>
  )
}
