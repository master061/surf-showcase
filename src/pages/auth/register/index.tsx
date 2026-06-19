import { View, Text, Input, Button, Picker } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { api } from '../../../api'

const years = ['2022', '2023', '2024', '2025', '2026', '2027']

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [studentId, setStudentId] = useState('')
  const [institution, setInstitution] = useState('')
  const [yearIdx, setYearIdx] = useState(3)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const h = async () => {
    if (!name || !email || !pw) { setError('请填写所有必填项'); return }
    if (pw.length < 6) { setError('密码至少6位'); return }
    setLoading(true)
    setError('')
    try {
      await api.register(name, email, pw, studentId, institution, years[yearIdx])
      Taro.showToast({ title: '注册成功', icon: 'success' })
      Taro.redirectTo({ url: '/pages/auth/login' })
    } catch (e) {
      const msg = (e as { data?: { error?: string } })?.data?.error || '注册失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ minHeight: '100vh', padding: '20px 24px' }}>
      <View style={{ textAlign: 'center', marginBottom: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>学生注册</Text>
        <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>加入 SURF 科研展示平台</Text>
      </View>
      <View className="card" style={{ borderRadius: 16, padding: 24 }}>
        {error && <View style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</View>}
        <View className="input-group"><Text className="input-label">姓名 *</Text><Input value={name} onInput={e => setName(e.detail.value)} placeholder="你的姓名" className="input" /></View>
        <View className="input-group"><Text className="input-label">邮箱 *</Text><Input value={email} onInput={e => setEmail(e.detail.value)} placeholder="your@email.com" className="input" /></View>
        <View className="input-group"><Text className="input-label">密码（至少6位）*</Text><Input type="password" value={pw} onInput={e => setPw(e.detail.value)} placeholder="至少6位密码" className="input" /></View>
        <View className="input-group"><Text className="input-label">学号</Text><Input value={studentId} onInput={e => setStudentId(e.detail.value)} placeholder="输入学号" className="input" /></View>
        <View className="input-group"><Text className="input-label">学校/院系</Text><Input value={institution} onInput={e => setInstitution(e.detail.value)} placeholder="计算机科学与技术学院" className="input" /></View>
        <View className="input-group"><Text className="input-label">入学年份</Text><Picker mode="selector" range={years} value={yearIdx} onChange={e => setYearIdx(Number(e.detail.value))}><View className="input">{years[yearIdx]}</View></Picker></View>
        <Button className="btn btn-primary btn-block" style={{ marginTop: 8, borderRadius: 10, padding: 12, fontSize: 15 }} loading={loading} onClick={h}>注册</Button>
        <View style={{ textAlign: 'center', marginTop: 16 }}>
          <Text style={{ fontSize: 13, color: '#9ca3af' }}>已有账号？</Text>
          <Text style={{ fontSize: 13, color: '#1e40af', fontWeight: 500, marginLeft: 4 }} onClick={() => Taro.redirectTo({ url: '/pages/auth/login' })}>立即登录</Text>
        </View>
      </View>
    </View>
  )
}
