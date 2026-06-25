import { View, Text, Input, Textarea, Picker, Button, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { api } from '../../api'

const fields = ['计算机科学', '人工智能', '生物医药', '物理数学', '化学材料', '工程技术', '社会科学', '人文艺术']
const years = ['2023', '2024', '2025', '2026']
const types = ['个人项目', '团队项目', '班级项目']
const typeValues = ['INDIVIDUAL', 'TEAM', 'CLASS']

export default function Edit() {
  const { id } = Taro.getCurrentInstance()?.router?.params as { id: string } || { id: '' }
  const [f, setF] = useState({ title: '', abstract: '', content: '', field: 0, tags: '', thumbnail: '', studentName: '', institution: '', year: 2, type: 0, isRecruiting: false, recruitingInfo: '' })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  const h = (k: string, v: string | number | boolean) => setF(p => ({ ...p, [k]: v }))

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
        isRecruiting: p.isRecruiting || false,
        recruitingInfo: p.recruitingInfo || '',
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
        isRecruiting: f.isRecruiting,
        recruitingInfo: f.recruitingInfo || undefined,
      })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 600)
    } catch { setError('保存失败') } finally { setLoading(false) }
  }

  const tagChips = f.tags ? f.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  if (fetching) return <View style={{ padding: 20 }}>{[1, 2, 3].map(i => <View key={i} className="card skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 12 }} />)}</View>

  return (
    <View style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <View style={{ flex: 1, padding: '12px 16px', paddingBottom: 80 }}>
        <Text style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4, display: 'block' }}>编辑项目</Text>
        <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16, display: 'block' }}>修改项目信息并保存</Text>

        <View className="card" style={{ borderRadius: 14, padding: 20 }}>
          {error && <View style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, border: '1px solid #fecaca' }}>{error}</View>}

          <View className="input-group">
            <Text className="input-label">标题 <Text className="required">*</Text></Text>
            <Input value={f.title} onInput={e => h('title', e.detail.value)} className="input" />
          </View>

          <View className="input-group">
            <Text className="input-label">领域 <Text className="required">*</Text></Text>
            <Picker mode="selector" range={fields} value={f.field} onChange={e => h('field', Number(e.detail.value))}>
              <View className="picker-input">{fields[f.field]}</View>
            </Picker>
          </View>

          <View className="input-group">
            <Text className="input-label">姓名</Text>
            <Input value={f.studentName} onInput={e => h('studentName', e.detail.value)} className="input" />
          </View>

          <View className="input-group">
            <Text className="input-label">学校/院系</Text>
            <Input value={f.institution} onInput={e => h('institution', e.detail.value)} className="input" />
          </View>

          <View className="flex" style={{ gap: 10 }}>
            <View className="input-group" style={{ flex: 1 }}>
              <Text className="input-label">项目年份</Text>
              <Picker mode="selector" range={years} value={f.year} onChange={e => h('year', Number(e.detail.value))}>
                <View className="picker-input">{years[f.year]}</View>
              </Picker>
            </View>
            <View className="input-group" style={{ flex: 1 }}>
              <Text className="input-label">项目类型</Text>
              <Picker mode="selector" range={types} value={f.type} onChange={e => h('type', Number(e.detail.value))}>
                <View className="picker-input">{types[f.type]}</View>
              </Picker>
            </View>
          </View>

          {/* Recruiting toggle */}
          <View style={{ background: f.isRecruiting ? '#fef2f2' : '#f9fafb', borderRadius: 10, padding: 12, marginBottom: 14, border: f.isRecruiting ? '1px solid #fecaca' : '1px solid #e5e7eb' }}>
            <View className="flex items-center justify-between" style={{ marginBottom: f.isRecruiting ? 10 : 0 }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'block' }}>🔥 招募团队成员</Text>
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>开启后项目将展示在招募专区</Text>
              </View>
              <View
                style={{
                  width: 44, height: 24, borderRadius: 12, padding: 2,
                  background: f.isRecruiting ? '#dc2626' : '#d1d5db',
                  display: 'flex', alignItems: 'center',
                  justifyContent: f.isRecruiting ? 'flex-end' : 'flex-start',
                }}
                onClick={() => h('isRecruiting', !f.isRecruiting)}
              >
                <View style={{ width: 20, height: 20, borderRadius: 10, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </View>
            </View>
            {f.isRecruiting && (
              <Textarea
                value={f.recruitingInfo}
                onInput={e => h('recruitingInfo', e.detail.value)}
                className="textarea"
                placeholder="描述招募需求：需要什么方向的同学？几个人？有什么要求？如何联系？"
                style={{ minHeight: 60, fontSize: 13, borderColor: '#fecaca' }}
              />
            )}
          </View>

          <View className="input-group">
            <Text className="input-label">摘要 <Text className="required">*</Text></Text>
            <Textarea value={f.abstract} onInput={e => h('abstract', e.detail.value)} className="textarea" style={{ minHeight: 72 }} />
          </View>

          <View className="input-group">
            <Text className="input-label">详细介绍 <Text className="required">*</Text></Text>
            <Textarea value={f.content} onInput={e => h('content', e.detail.value)} className="textarea" style={{ minHeight: 140 }} />
          </View>

          <View className="input-group">
            <Text className="input-label">封面图 URL</Text>
            <Input value={f.thumbnail} onInput={e => h('thumbnail', e.detail.value)} className="input" />
            {f.thumbnail && (
              <View style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <Image src={f.thumbnail} style={{ width: '100%', height: 120 }} mode="aspectFill" onError={() => Taro.showToast({ title: '图片加载失败', icon: 'none' })} />
              </View>
            )}
          </View>

          <View className="input-group">
            <Text className="input-label">标签（逗号分隔）</Text>
            <Input value={f.tags} onInput={e => h('tags', e.detail.value)} className="input" />
            {tagChips.length > 0 && (
              <View className="flex flex-wrap" style={{ gap: 6, marginTop: 8 }}>
                {tagChips.map(t => (
                  <View key={t} className="tag-chip">{t}</View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Sticky submit */}
      <View className="sticky-bottom">
        <Button className="btn btn-primary btn-block" style={{ borderRadius: 12, padding: 13, fontSize: 15, fontWeight: 600 }} loading={loading} onClick={submit}>保存修改</Button>
      </View>
    </View>
  )
}
