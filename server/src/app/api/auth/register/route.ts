import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, studentId, institution, year } = await request.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: '姓名、邮箱、密码为必填项' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 })
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 })
    }
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword(password),
        role: 'STUDENT',
        studentId: studentId || null,
        institution: institution || null,
        year: year ? parseInt(year) : null,
      },
    })
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
    return NextResponse.json({ error: '注册失败' }, { status: 500 })
  }
}
