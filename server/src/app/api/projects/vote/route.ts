import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const payload = getUserFromRequest(request)
  if (!payload) return unauthorized()

  const { projectId } = await request.json()
  if (!projectId) return NextResponse.json({ error: '缺少 projectId' }, { status: 400 })

  const existing = await prisma.vote.findUnique({
    where: { userId_projectId: { userId: payload.id, projectId } },
  })

  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } })
    return NextResponse.json({ voted: false })
  } else {
    await prisma.vote.create({ data: { userId: payload.id, projectId } })
    return NextResponse.json({ voted: true })
  }
}
