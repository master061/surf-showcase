import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

export async function GET(request: Request) {
  const payload = getUserFromRequest(request)
  if (!payload) return unauthorized()

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true, name: true, email: true, role: true,
      studentId: true, institution: true, year: true,
      avatar: true, bio: true,
      _count: { select: { projects: true } },
    },
  })
  if (!user) return unauthorized()
  return NextResponse.json(user)
}

export async function PUT(request: NextRequest) {
  const payload = getUserFromRequest(request)
  if (!payload) return unauthorized()

  const { name, avatar, bio, studentId, institution, year } = await request.json()
  const user = await prisma.user.update({
    where: { id: payload.id },
    data: {
      ...(name !== undefined && { name }),
      ...(avatar !== undefined && { avatar: avatar || null }),
      ...(bio !== undefined && { bio: bio || null }),
      ...(studentId !== undefined && { studentId: studentId || null }),
      ...(institution !== undefined && { institution: institution || null }),
      ...(year !== undefined && { year: year ? parseInt(year) : null }),
    },
  })
  return NextResponse.json({
    id: user.id, name: user.name, email: user.email, role: user.role,
    studentId: user.studentId, institution: user.institution, year: user.year,
    avatar: user.avatar, bio: user.bio,
  })
}
