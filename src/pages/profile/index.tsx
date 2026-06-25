import { View, Text, Input, Textarea, Picker, Button, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useAuth } from '../../components/AuthStore'
import { api } from '../../api'

const years = ['2022', '2023', '2024', '2025', '2026', '2027']

export default function Profile() {
  const { user, refreshProfile } = useAuth()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [studentId, setStudentId] = useState('')
  const [institution, setInstitution] = useState('')
  const [yearIdx, setYearIdx] = useState(3)
  const [loading, setLoading] = useState(false)
  const [fetch, setFetch] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getProfile().then(u => {
      setName(u.name)
      setBio(u.bio || '')
      setAvatar(u.avatar || '')
      setStudentId(u.studentId || '')
      setInstitution(u.institution || '')
      const yi = years.indexOf(String(u.year || ''))
      setYearIdx(yi >= 0 ? yi : 3)
    }).catch(() => { Taro.showToast({ title: '加载失败', icon: 'none' }); Taro.navigateBack() })
      .finally(() => setFetch(false))
  }, [])

  const save = async () => {
    setLoading(true)
    setError('')
    try {
      await api.updateProfile({ name, avatar: avatar || undefined, bio, studentId, institution, year: years[yearIdx] })
      await refreshProfile()
      Taro.showToast({ title: '保存成功', icon: 'success' })
    } catch { setError('保存失败') } finally { setLoading(false) }
  }

  if (fetch) return <View style={{ padding: '20px 16px' }}>{[1, 2, 3, 4].map(i => <View key={i} className="card skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 12 }} />)}</View>

  return (
    <View style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <View style={{ flex: 1, padding: '12px 16px', paddingBottom: 80 }}>
        <Text style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4, display: 'block' }}>个人资料</Text>
        <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16, display: 'block' }}>完善你的个人学术档案</Text>

        <View className="card" style={{ borderRadius: 14, padding: 20 }}>
          {error && <View style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, border: '1px solid #fecaca' }}>{error}</View>}

          {/* Avatar */}
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            {avatar ? (
              <Image src={avatar} style={{ width: 80, height: 80, borderRadius: 40, border: '3px solid #eff6ff', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }} mode="aspectFill" />
            ) : (
              <View style={{ width: 80, height: 80, borderRadius: 40, background: 'linear-gradient(135deg,#1e40af,#3730a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(30,64,175,0.3)' }}>
                <Text style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>{user?.name?.[0]}</Text>
              </View>
            )}
          </View>

          <View className="input-group">
            <Text className="input-label">邮箱</Text>
            <Input value={user?.email || ''} disabled className="input" />
          </View>

          <View className="input-group">
            <Text className="input-label">姓名 <Text className="required">*</Text></Text>
            <Input value={name} onInput={e => setName(e.detail.value)} className="input" placeholder="你的姓名" />
          </View>

          <View className="flex" style={{ gap: 10 }}>
            <View className="input-group" style={{ flex: 1 }}>
              <Text className="input-label">学号</Text>
              <Input value={studentId} onInput={e => setStudentId(e.detail.value)} className="input" placeholder="学号" />
            </View>
            <View className="input-group" style={{ flex: 1 }}>
              <Text className="input-label">入学年份</Text>
              <Picker mode="selector" range={years} value={yearIdx} onChange={e => setYearIdx(Number(e.detail.value))}>
                <View className="picker-input">{years[yearIdx]}</View>
              </Picker>
            </View>
          </View>

          <View className="input-group">
            <Text className="input-label">学校/院系</Text>
            <Input value={institution} onInput={e => setInstitution(e.detail.value)} className="input" placeholder="计算机科学与技术学院" />
          </View>

          <View className="input-group">
            <Text className="input-label">个人简介</Text>
            <Textarea value={bio} onInput={e => setBio(e.detail.value)} className="textarea" placeholder="介绍一下你的研究方向、学术兴趣..." style={{ minHeight: 80 }} />
          </View>

          <View className="input-group">
            <Text className="input-label">头像 URL</Text>
            <Input value={avatar} onInput={e => setAvatar(e.detail.value)} className="input" placeholder="https://example.com/avatar.jpg" />
            {avatar && (
              <View style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Image src={avatar} style={{ width: 40, height: 40, borderRadius: 20, border: '1px solid #e5e7eb' }} mode="aspectFill" onError={() => Taro.showToast({ title: '图片加载失败', icon: 'none' })} />
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>头像预览</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Sticky save */}
      <View className="sticky-bottom">
        <Button className="btn btn-primary btn-block" style={{ borderRadius: 12, padding: 13, fontSize: 15, fontWeight: 600 }} loading={loading} onClick={save}>保存修改</Button>
      </View>
    </View>
  )
}
