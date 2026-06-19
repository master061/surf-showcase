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
    <View style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <View style={{ width: '100%', maxWidth: 360 }}>
        <View style={{ textAlign: 'center', marginBottom: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg,#1e40af,#3730a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Text style={{ fontSize: 28, color: '#fff', fontWeight: 700 }}>S</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>欢迎回来</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>登录 SURF 科研展示平台</Text>
        </View>
        <View className="card" style={{ borderRadius: 16, padding: 24 }}>
          {error && <View style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</View>}
          <View className="input-group">
            <Text className="input-label">邮箱</Text>
            <Input value={email} onInput={e => setEmail(e.detail.value)} placeholder="your@email.com" className="input" />
          </View>
          <View className="input-group">
            <Text className="input-label">密码</Text>
            <Input type="password" value={pw} onInput={e => setPw(e.detail.value)} placeholder="输入密码" className="input" />
          </View>
          <Button className="btn btn-primary btn-block" style={{ marginTop: 8, borderRadius: 10, padding: 12, fontSize: 15 }} loading={loading} onClick={h}>登录</Button>
          <View style={{ textAlign: 'center', marginTop: 16 }}>
            <Text style={{ fontSize: 13, color: '#9ca3af' }}>还没有账号？</Text>
            <Text style={{ fontSize: 13, color: '#1e40af', fontWeight: 500, marginLeft: 4 }} onClick={() => Taro.redirectTo({ url: '/pages/auth/register' })}>立即注册</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
