import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, unauthorized, forbidden } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { votes: true } },
      user: { select: { id: true, name: true, avatar: true, institution: true } },
    },
  })
  if (!project) return NextResponse.json({ error: '项目不存在' }, { status: 404 })

  // Check if current user has voted or favorited
  const payload = getUserFromRequest(request)
  let hasVoted = false
  let hasFavorited = false
  if (payload) {
    const [vote, fav] = await Promise.all([
      prisma.vote.findUnique({ where: { userId_projectId: { userId: payload.id, projectId: params.id } } }),
      prisma.favorite.findUnique({ where: { userId_projectId: { userId: payload.id, projectId: params.id } } }),
    ])
    hasVoted = !!vote
    hasFavorited = !!fav
  }

  return NextResponse.json({ ...project, hasVoted, hasFavorited })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = getUserFromRequest(request)
  if (!payload) return unauthorized()

  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) return NextResponse.json({ error: '项目不存在' }, { status: 404 })
  if (project.userId !== payload.id && payload.role !== 'ADMIN') return forbidden()

  const { title, abstract, content, methods, results, references, field, tags, thumbnail, images, year, type, studentName, institution, isRecruiting, recruitingInfo } = await request.json()
  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(abstract !== undefined && { abstract }),
      ...(content !== undefined && { content }),
      ...(methods !== undefined && { methods }),
      ...(results !== undefined && { results }),
      ...(references !== undefined && { references }),
      ...(field !== undefined && { field }),
      ...(tags !== undefined && { tags }),
      ...(thumbnail !== undefined && { thumbnail }),
      ...(images !== undefined && { images }),
      ...(year !== undefined && { year: year ? parseInt(year) : null }),
      ...(type !== undefined && { type }),
      ...(studentName !== undefined && { studentName }),
      ...(institution !== undefined && { institution }),
      ...(isRecruiting !== undefined && { isRecruiting }),
      ...(recruitingInfo !== undefined && { recruitingInfo }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = getUserFromRequest(request)
  if (!payload) return unauthorized()

  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) return NextResponse.json({ error: '项目不存在' }, { status: 404 })
  if (project.userId !== payload.id && payload.role !== 'ADMIN') return forbidden()

  await prisma.project.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
