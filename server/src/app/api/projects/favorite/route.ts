import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const payload = getUserFromRequest(request)
  if (!payload) return unauthorized()

  const { projectId } = await request.json()
  if (!projectId) {
    return NextResponse.json({ error: '缺少项目ID' }, { status: 400 })
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_projectId: { userId: payload.id, projectId } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ favorited: false })
  }

  await prisma.favorite.create({
    data: { userId: payload.id, projectId },
  })
  return NextResponse.json({ favorited: true })
}
