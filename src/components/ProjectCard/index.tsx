import { View, Text, Navigator, Image } from '@tarojs/components'
import type { Project } from '../../api'

const typeLabels: Record<string, string> = { INDIVIDUAL: '个人', TEAM: '团队', CLASS: '班级' }
const typeColors: Record<string, string> = { INDIVIDUAL: '#15803d', TEAM: '#7c3aed', CLASS: '#1d4ed8' }
const typeBgColors: Record<string, string> = { INDIVIDUAL: '#f0fdf4', TEAM: '#f5f3ff', CLASS: '#eff6ff' }
const fieldAccentColors: Record<string, string> = {
  '计算机科学': '#3b82f6',
  '人工智能': '#8b5cf6',
  '生物医药': '#10b981',
  '物理数学': '#f59e0b',
  '化学材料': '#06b6d4',
  '工程技术': '#f97316',
  '社会科学': '#ec4899',
  '人文艺术': '#6366f1',
}

export default function ProjectCard({ project }: { project: Project }) {
  const tags = project.tags ? project.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const accentColor = fieldAccentColors[project.field] || '#3b82f6'

  return (
    <Navigator url={`/pages/detail/index?id=${project.id}`}>
      <View className="card card-clickable" style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12, borderLeft: `3px solid ${accentColor}` }}>
        {project.thumbnail && <Image src={project.thumbnail} style={{ width: '100%', height: 160 }} mode="aspectFill" />}
        <View style={{ padding: 14 }}>
          {/* Title */}
          <Text style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8, lineHeight: 1.4, display: 'block' }}>{project.title}</Text>

          {/* Abstract */}
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {project.abstract}
          </Text>

          {/* Badges row */}
          <View className="flex items-center flex-wrap" style={{ gap: 6, marginBottom: tags.length > 0 ? 8 : 0 }}>
            <Text className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: 10 }}>{project.field}</Text>
            {project.year && <Text className="badge badge-gray" style={{ fontSize: 10 }}>{project.year}</Text>}
            <Text className="badge" style={{ background: typeBgColors[project.type] || '#f0fdf4', color: typeColors[project.type] || '#15803d', fontSize: 10 }}>{typeLabels[project.type] || project.type}</Text>
          </View>

          {/* Tags */}
          {tags.length > 0 && (
            <View className="flex flex-wrap" style={{ gap: 4, marginBottom: 10 }}>
              {tags.slice(0, 3).map(t => (
                <Text key={t} className="tag-chip" style={{ fontSize: 10, padding: '2px 8px' }}>{t}</Text>
              ))}
              {tags.length > 3 && <Text style={{ fontSize: 10, color: '#9ca3af', padding: '2px 4px' }}>+{tags.length - 3}</Text>}
            </View>
          )}

          {/* Author + Votes footer */}
          <View style={{ borderTop: '1px solid #f3f4f6', paddingTop: 10, marginTop: 2 }}>
            <View className="flex items-center justify-between">
              <View className="flex items-center" style={{ gap: 6 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, background: 'linear-gradient(135deg,#1e40af,#3730a3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>{project.studentName?.[0]}</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>{project.studentName} · {project.institution}</Text>
              </View>
              <View className="flex items-center" style={{ gap: 3 }}>
                <Text style={{ fontSize: 13 }}>★</Text>
                <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{project._count.votes}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Navigator>
  )
}
