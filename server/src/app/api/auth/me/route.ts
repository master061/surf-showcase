import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

export async function GET(request: Request) {
  const payload = getUserFromRequest(request)
  if (!payload) return unauthorized()

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: { _count: { select: { projects: true } } },
  })
  if (!user) return unauthorized()

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
    institution: user.institution,
    year: user.year,
    avatar: user.avatar,
    bio: user.bio,
    _count: user._count,
  })
}
