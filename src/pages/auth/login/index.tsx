import { View, Text, Input, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { useAuth } from '../../../components/AuthStore'
import { api } from '../../../api'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const h = async () => {
    if (!email || !pw) return
    setLoading(true)
    setError('')
    try {
      const res = await api.login(email, pw)
      login(res.user, res.token)
      Taro.showToast({ title: '登录成功', icon: 'success' })
      Taro.navigateBack()
    } catch {
      setError('邮箱或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#f0f4ff 0%,#f3f4f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      {/* Decorative top circles */}
      <View style={{ position: 'absolute', top: -80, right: -40, width: 200, height: 200, borderRadius: 100, background: 'rgba(30,64,175,0.06)' }} />
      <View style={{ position: 'absolute', top: 20, left: -60, width: 140, height: 140, borderRadius: 70, background: 'rgba(55,48,163,0.04)' }} />

      <View style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <View style={{ textAlign: 'center', marginBottom: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#1e40af,#3730a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 6px 20px rgba(30,64,175,0.3)' }}>
            <Text style={{ fontSize: 32, color: '#fff', fontWeight: 800, letterSpacing: 1 }}>S</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: 700, color: '#111827', display: 'block' }}>欢迎回来</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 4, display: 'block' }}>登录 SURF 科研展示平台</Text>
        </View>

        {/* Form card */}
        <View className="card" style={{ borderRadius: 18, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {error && (
            <View style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, border: '1px solid #fecaca' }}>{error}</View>
          )}

          <View className="input-group">
            <Text className="input-label">邮箱</Text>
            <View style={{ position: 'relative' }}>
              <Text style={{ position: 'absolute', left: 12, top: 10, fontSize: 14, zIndex: 1 }}>📧</Text>
              <Input value={email} onInput={e => setEmail(e.detail.value)} placeholder="your@email.com" className="input" style={{ paddingLeft: 36 }} />
            </View>
          </View>

          <View className="input-group">
            <Text className="input-label">密码</Text>
            <View style={{ position: 'relative' }}>
              <Text style={{ position: 'absolute', left: 12, top: 10, fontSize: 14, zIndex: 1 }}>🔒</Text>
              <Input type="password" value={pw} onInput={e => setPw(e.detail.value)} placeholder="输入密码" className="input" style={{ paddingLeft: 36 }} />
            </View>
          </View>

          <Button className="btn btn-primary btn-block" style={{ marginTop: 8, borderRadius: 12, padding: 13, fontSize: 15, fontWeight: 600 }} loading={loading} onClick={h}>登录</Button>

          <View style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
            <Text style={{ fontSize: 13, color: '#9ca3af' }}>还没有账号？</Text>
            <Text style={{ fontSize: 13, color: '#1e40af', fontWeight: 600, marginLeft: 4 }} onClick={() => Taro.redirectTo({ url: '/pages/auth/register/index' })}>立即注册</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
