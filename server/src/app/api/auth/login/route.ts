import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码为必填项' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !comparePassword(password, user.password)) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role })
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        institution: user.institution,
        year: user.year,
        avatar: user.avatar,
        bio: user.bio,
      },
    })
  } catch {
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
