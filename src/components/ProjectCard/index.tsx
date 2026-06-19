import { View, Text, Navigator, Image } from '@tarojs/components'
import type { Project } from '../../api'

const typeLabels: Record<string, string> = { INDIVIDUAL: '个人', TEAM: '团队', CLASS: '班级' }

export default function ProjectCard({ project }: { project: Project }) {
  const tags = project.tags ? project.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  return (
    <Navigator url={`/pages/detail/index?id=${project.id}`}>
      <View className="card" style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
        {project.thumbnail && <Image src={project.thumbnail} style={{ width: '100%', height: 160 }} mode="aspectFill" />}
        <View style={{ padding: 14 }}>
          <View className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <View className="flex gap-2">
              <Text className="badge badge-blue">{project.field}</Text>
              {project.year && <Text className="badge badge-gray">{project.year}</Text>}
              <Text className="badge badge-green">{typeLabels[project.type] || project.type}</Text>
            </View>
            <View className="flex items-center gap-1">
              <Text style={{ fontSize: 11, color: '#f59e0b' }}>★</Text>
              <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{project._count.votes}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6, lineHeight: 1.4 }}>{project.title}</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 10, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{project.abstract}</Text>
          {tags.length > 0 && (
            <View className="flex flex-wrap gap-1" style={{ marginBottom: 10 }}>
              {tags.slice(0, 3).map(t => <Text key={t} className="badge badge-gray">{t}</Text>)}
            </View>
          )}
          <View style={{ borderTop: '1px solid #f3f4f6', paddingTop: 10, marginTop: 2 }}>
            <View className="flex items-center gap-2">
              <Text style={{ width: 20, height: 20, borderRadius: 10, background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{project.studentName?.[0]}</Text>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>{project.studentName} · {project.institution}</Text>
            </View>
          </View>
        </View>
      </View>
    </Navigator>
  )
}
