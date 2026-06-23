import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const sort = searchParams.get('sort') || 'newest'
  const field = searchParams.get('field')
  const type = searchParams.get('type')
  const year = searchParams.get('year')
  const tag = searchParams.get('tag')
  const search = searchParams.get('search')
  const recruiting = searchParams.get('recruiting')

  const where: any = {}

  if (field) where.field = field
  if (type) where.type = type
  if (year) where.year = parseInt(year)
  if (recruiting === 'true') where.isRecruiting = true
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { abstract: { contains: search } },
      { content: { contains: search } },
      { tags: { contains: search } },
      { field: { contains: search } },
      { studentName: { contains: search } },
    ]
  }
  if (tag) {
    where.tags = { contains: tag }
  }

  const orderBy: any = sort === 'hot'
    ? { votes: { _count: 'desc' } }
    : { createdAt: 'desc' }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { votes: true } },
        user: { select: { id: true, name: true, avatar: true, institution: true } },
      },
    }),
    prisma.project.count({ where }),
  ])

  return NextResponse.json({ projects, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: NextRequest) {
  const payload = getUserFromRequest(request)
  if (!payload) return unauthorized()

  const { title, abstract, content, field, tags, thumbnail, studentName, institution, year, type, isRecruiting, recruitingInfo } = await request.json()
  if (!title || !abstract || !content || !field) {
    return NextResponse.json({ error: '标题、摘要、内容和领域为必填项' }, { status: 400 })
  }

  const project = await prisma.project.create({
    data: {
      title, abstract, content, field,
      tags: tags || '',
      thumbnail: thumbnail || null,
      studentName,
      institution,
      year: year ? parseInt(year) : null,
      type: type || 'INDIVIDUAL',
      isRecruiting: !!isRecruiting,
      recruitingInfo: recruitingInfo || null,
      userId: payload.id,
    },
  })
  return NextResponse.json(project, { status: 201 })
}
