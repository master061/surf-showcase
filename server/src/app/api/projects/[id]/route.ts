import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, unauthorized, forbidden } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { votes: true } },
      user: { select: { id: true, name: true, avatar: true, institution: true } },
    },
  })
  if (!project) return NextResponse.json({ error: '项目不存在' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = getUserFromRequest(request)
  if (!payload) return unauthorized()

  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) return NextResponse.json({ error: '项目不存在' }, { status: 404 })
  if (project.userId !== payload.id && payload.role !== 'ADMIN') return forbidden()

  const { title, abstract, content, field, tags, thumbnail, year, type, studentName, institution, isRecruiting, recruitingInfo } = await request.json()
  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(abstract !== undefined && { abstract }),
      ...(content !== undefined && { content }),
      ...(field !== undefined && { field }),
      ...(tags !== undefined && { tags }),
      ...(thumbnail !== undefined && { thumbnail }),
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
