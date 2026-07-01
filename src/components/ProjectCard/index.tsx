import { View, Text, Navigator, Image } from '@tarojs/components'
import type { Project } from '../../api'

const typeLabels: Record<string, string> = { INDIVIDUAL: '个人', TEAM: '团队', CLASS: '班级' }
const typeColors: Record<string, string> = { INDIVIDUAL: '#059669', TEAM: '#7C3AED', CLASS: '#2563EB' }
const typeBgs: Record<string, string> = { INDIVIDUAL: '#ECFDF5', TEAM: '#F5F3FF', CLASS: '#EFF6FF' }
const fieldColors: Record<string, string> = {
  '计算机科学': '#2563EB', '人工智能': '#7C3AED', '生物医药': '#059669',
  '物理数学': '#D97706', '化学材料': '#0891B2', '工程技术': '#EA580C',
  '社会科学': '#DB2777', '人文艺术': '#4F46E5',
}
const fieldBgs: Record<string, string> = {
  '计算机科学': '#EFF6FF', '人工智能': '#F5F3FF', '生物医药': '#ECFDF5',
  '物理数学': '#FFFBEB', '化学材料': '#ECFEFF', '工程技术': '#FFF7ED',
  '社会科学': '#FDF2F8', '人文艺术': '#EEF2FF',
}

export default function ProjectCard({ project }: { project: Project }) {
  const tags = project.tags ? project.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const fg = fieldColors[project.field] || '#2563EB'
  const bg = fieldBgs[project.field] || '#EFF6FF'

  return (
    <Navigator url={`/pages/detail/index?id=${project.id}`}>
      <View className="card card-clickable" style={{
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        {/* ── Top: thumbnail or colored strip ── */}
        {project.thumbnail ? (
          <View style={{ position: 'relative' }}>
            <Image src={project.thumbnail} style={{ width: '100%', height: 140 }} mode="aspectFill" />
            {/* gradient overlay at bottom */}
            <View style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.45))',
            }} />
            {/* badges on image */}
            <View style={{ position: 'absolute', bottom: 8, left: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <View style={{ padding: '3px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 600, color: fg }}>
                {project.field}
              </View>
              {project.year && (
                <View style={{ padding: '3px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.85)', fontSize: 10, color: '#475569' }}>
                  {project.year}
                </View>
              )}
              {project.isRecruiting && (
                <View style={{ padding: '3px 10px', borderRadius: 10, background: '#FEF2F2', fontSize: 10, fontWeight: 700, color: '#DC2626' }}>
                  🔥 招募中
                </View>
              )}
            </View>
          </View>
        ) : (
          /* colored top accent bar */
          <View style={{ height: 6, background: fg }} />
        )}

        {/* ── Body ── */}
        <View style={{ padding: project.thumbnail ? '12px 14px 14px' : '14px 14px 14px' }}>
          {/* Title */}
          <Text style={{
            fontSize: 16, fontWeight: 700, color: '#0F172A',
            display: 'block', lineHeight: 1.35, marginBottom: 6,
          }}>{project.title}</Text>

          {/* Abstract */}
          <Text style={{
            fontSize: 13, color: '#64748B', lineHeight: 1.65,
            marginBottom: 10,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {project.abstract}
          </Text>

          {/* Badges row — only for non-thumbnail cards (thumbnail cards show badges on image) */}
          {!project.thumbnail && (
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: tags.length > 0 ? 10 : 0 }}>
              <View style={{ padding: '2px 10px', borderRadius: 100, background: bg, fontSize: 11, fontWeight: 600, color: fg }}>
                {project.field}
              </View>
              {project.year && (
                <View style={{ padding: '2px 10px', borderRadius: 100, background: '#F3F4F6', fontSize: 11, color: '#6B7280' }}>
                  {project.year}
                </View>
              )}
              <View style={{
                padding: '2px 10px', borderRadius: 100,
                background: typeBgs[project.type] || '#ECFDF5',
                fontSize: 11, fontWeight: 500,
                color: typeColors[project.type] || '#059669',
              }}>
                {typeLabels[project.type] || '个人'}
              </View>
              {project.isRecruiting && (
                <View style={{ padding: '2px 10px', borderRadius: 100, background: '#FEF2F2', fontSize: 11, fontWeight: 700, color: '#DC2626' }}>
                  🔥 招募
                </View>
              )}
            </View>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {tags.slice(0, 3).map(t => (
                <View key={t} style={{
                  padding: '3px 10px', borderRadius: 100,
                  background: '#F8FAFC', border: '1px solid #E2E8F0',
                  fontSize: 11, color: '#475569',
                }}>
                  {t}
                </View>
              ))}
              {tags.length > 3 && (
                <Text style={{ fontSize: 11, color: '#94A3B8', padding: '3px 0' }}>+{tags.length - 3}</Text>
              )}
            </View>
          )}

          {/* ── Footer: author + votes ── */}
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
            <View style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* avatar */}
              <View style={{
                width: 26, height: 26, borderRadius: 13,
                background: `linear-gradient(135deg, ${fg}, ${fg}dd)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                  {(project.studentName || '?')[0]}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 2 }}>
                  {project.studentName || '未知'}
                </Text>
                <Text style={{ fontSize: 10, color: '#94A3B8', display: 'block' }}>
                  {project.institution || ''}
                </Text>
              </View>
            </View>

            {/* votes */}
            <View style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14, color: '#F59E0B' }}>★</Text>
              <Text style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                {project._count?.votes || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Navigator>
  )
}
