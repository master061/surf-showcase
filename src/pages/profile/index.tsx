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
    <View style={{ padding: '12px 16px' }}>
      <Text style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16 }}>个人资料</Text>
      <View className="card" style={{ borderRadius: 12, padding: 20 }}>
        {error && <View style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</View>}

        {/* Avatar */}
        <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          {avatar ? <Image src={avatar} style={{ width: 72, height: 72, borderRadius: 36 }} mode="aspectFill" /> :
            <View style={{ width: 72, height: 72, borderRadius: 36, background: 'linear-gradient(135deg,#1e40af,#3730a3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>{user?.name?.[0]}</Text>
            </View>}
        </View>

        <View className="input-group"><Text className="input-label">邮箱</Text><Input value={user?.email || ''} disabled className="input" style={{ background: '#f9fafb', color: '#9ca3af' }} /></View>
        <View className="input-group"><Text className="input-label">姓名</Text><Input value={name} onInput={e => setName(e.detail.value)} className="input" /></View>
        <View className="input-group"><Text className="input-label">学号</Text><Input value={studentId} onInput={e => setStudentId(e.detail.value)} className="input" /></View>
        <View className="input-group"><Text className="input-label">学校/院系</Text><Input value={institution} onInput={e => setInstitution(e.detail.value)} className="input" /></View>
        <View className="input-group"><Text className="input-label">入学年份</Text><Picker mode="selector" range={years} value={yearIdx} onChange={e => setYearIdx(Number(e.detail.value))}><View className="input">{years[yearIdx]}</View></Picker></View>
        <View className="input-group"><Text className="input-label">个人简介</Text><Textarea value={bio} onInput={e => setBio(e.detail.value)} className="input" style={{ minHeight: 80, lineHeight: 1.6 }} /></View>
        <View className="input-group"><Text className="input-label">头像URL</Text><Input value={avatar} onInput={e => setAvatar(e.detail.value)} className="input" /></View>

        <Button className="btn btn-primary btn-block" style={{ marginTop: 8, borderRadius: 10, padding: 12, fontSize: 15 }} loading={loading} onClick={save}>保存修改</Button>
      </View>
    </View>
  )
}
