import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || ''
  if (q.length < 1) return NextResponse.json({ titles: [], tags: [], studentNames: [], fields: [] })

  const [titles, tags, studentNames, fields] = await Promise.all([
    prisma.project.findMany({ where: { title: { contains: q } }, select: { title: true }, take: 5 }),
    prisma.project.findMany({ where: { tags: { contains: q } }, select: { tags: true }, take: 5 }),
    prisma.project.findMany({ where: { studentName: { contains: q } }, select: { studentName: true }, take: 5 }),
    prisma.project.findMany({ where: { field: { contains: q } }, select: { field: true }, take: 5 }),
  ])

  const extractTags = (items: { tags: string }[]) =>
    [...new Set(items.flatMap(i => i.tags.split(',').map(t => t.trim()).filter(Boolean)))]
      .slice(0, 5)

  return NextResponse.json({
    titles: [...new Set(titles.map(t => t.title))].slice(0, 5),
    tags: extractTags(tags),
    studentNames: [...new Set(studentNames.map(s => s.studentName))].slice(0, 5),
    fields: [...new Set(fields.map(f => f.field))].slice(0, 5),
  })
}
