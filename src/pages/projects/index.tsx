import { View, Text, Input, Picker, Navigator } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { api, type Project } from '../../api'
import ProjectCard from '../../components/ProjectCard'

const fields = ['全部', '计算机科学', '人工智能', '生物医药', '物理数学', '化学材料', '工程技术', '社会科学', '人文艺术']
const types = ['全部', '个人项目', '团队项目', '班级项目']
const typeValues = ['', 'INDIVIDUAL', 'TEAM', 'CLASS']
const years = ['全部', '2023', '2024', '2025', '2026']

export default function Projects() {
  const [list, setList] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fieldIdx, setFieldIdx] = useState(0)
  const [typeIdx, setTypeIdx] = useState(0)
  const [yearIdx, setYearIdx] = useState(0)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [suggestions, setSuggestions] = useState<{ titles: string[]; tags: string[]; studentNames: string[]; fields: string[] }>({ titles: [], tags: [], studentNames: [], fields: [] })
  const [showSug, setShowSug] = useState(false)
  let sugTimer: any

  const fetchList = async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.getProjects({
        page: p,
        sort,
        field: fieldIdx > 0 ? fields[fieldIdx] : undefined,
        type: typeValues[typeIdx] || undefined,
        year: yearIdx > 0 ? years[yearIdx] : undefined,
        search: search || undefined,
      })
      setList(res.projects)
      setPage(res.page)
      setTotalPages(res.totalPages)
    } catch { Taro.showToast({ title: '加载失败', icon: 'none' }) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchList(1) }, [sort, fieldIdx, typeIdx, yearIdx])

  const onSearch = () => { setShowSug(false); fetchList(1) }

  const onSearchInput = (v: string) => {
    setSearch(v)
    if (v.length >= 1) {
      clearTimeout(sugTimer)
      sugTimer = setTimeout(async () => {
        try { const s = await api.getSuggestions(v); setSuggestions(s); setShowSug(true) } catch { }
      }, 300)
    } else { setShowSug(false); setSuggestions({ titles: [], tags: [], studentNames: [], fields: [] }) }
  }

  return (
    <View style={{ padding: '12px 16px' }}>
      {/* Search */}
      <View style={{ position: 'relative', marginBottom: 12 }}>
        <Input value={search} onInput={e => onSearchInput(e.detail.value)} onConfirm={onSearch} placeholder="搜索项目、技能、研究方向..." className="input" style={{ paddingLeft: 36, borderRadius: 10, background: '#fff' }} />
        <Text style={{ position: 'absolute', left: 12, top: 10, fontSize: 16 }} onClick={onSearch}>🔍</Text>
        {showSug && (suggestions.titles.length > 0 || suggestions.tags.length > 0) && (
          <View style={{ position: 'absolute', top: 44, left: 0, right: 0, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, padding: 8 }}>
            {suggestions.titles.length > 0 && (
              <View style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: '#9ca3af', padding: '4px 8px' }}>项目标题</Text>
                {suggestions.titles.map(t => (
                  <Text key={t} style={{ fontSize: 13, padding: '6px 8px', color: '#374151' }} onClick={() => { setSearch(t); setShowSug(false); fetchList(1) }}>{t}</Text>
                ))}
              </View>
            )}
            {suggestions.tags.length > 0 && (
              <View>
                <Text style={{ fontSize: 11, color: '#9ca3af', padding: '4px 8px' }}>标签</Text>
                <View className="flex flex-wrap gap-1" style={{ padding: '4px 8px' }}>
                  {suggestions.tags.map(t => (
                    <Text key={t} className="badge badge-blue" onClick={() => { setSearch(t); setShowSug(false); fetchList(1) }}>{t}</Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Filters */}
      <View className="section-header" style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 12, color: '#9ca3af' }}>
          {loading ? '加载中...' : `找到 ${list.length} 个项目`}
        </Text>
      </View>
      <View className="flex items-center" style={{ gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Picker mode="selector" range={fields} value={fieldIdx} onChange={e => setFieldIdx(Number(e.detail.value))}>
          <View className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', padding: '6px 12px' }}>{fields[fieldIdx]} ▾</View>
        </Picker>
        <Picker mode="selector" range={types} value={typeIdx} onChange={e => setTypeIdx(Number(e.detail.value))}>
          <View className="badge" style={{ background: '#f0fdf4', color: '#15803d', padding: '6px 12px' }}>{types[typeIdx]} ▾</View>
        </Picker>
        <Picker mode="selector" range={years} value={yearIdx} onChange={e => setYearIdx(Number(e.detail.value))}>
          <View className="badge" style={{ background: '#fefce8', color: '#a16207', padding: '6px 12px' }}>{years[yearIdx]} ▾</View>
        </Picker>
        <View style={{ marginLeft: 'auto', display: 'flex', gap: 2, background: '#f3f4f6', borderRadius: 10, padding: 3 }}>
          <Text style={{ background: sort === 'newest' ? '#fff' : 'transparent', color: sort === 'newest' ? '#1e40af' : '#6b7280', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: sort === 'newest' ? 600 : 400, boxShadow: sort === 'newest' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }} onClick={() => setSort('newest')}>最新</Text>
          <Text style={{ background: sort === 'hot' ? '#fff' : 'transparent', color: sort === 'hot' ? '#1e40af' : '#6b7280', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: sort === 'hot' ? 600 : 400, boxShadow: sort === 'hot' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }} onClick={() => setSort('hot')}>最热</Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View>{[1, 2, 3].map(i => <View key={i} className="card skeleton" style={{ height: 100, borderRadius: 12, marginBottom: 12 }} />)}</View>
      ) : list.length === 0 ? (
        <View className="empty-state"><Text className="empty-state-icon">📭</Text><Text className="empty-state-text">暂无项目</Text></View>
      ) : (
        <View>{list.map(p => <ProjectCard key={p.id} project={p} />)}</View>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <View className="flex items-center justify-center" style={{ gap: 8, marginTop: 12, padding: 8 }}>
          <Text className="btn btn-outline btn-sm" style={page <= 1 ? { opacity: 0.4 } : {}} onClick={() => page > 1 && fetchList(page - 1)}>上一页</Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>{page}/{totalPages}</Text>
          <Text className="btn btn-outline btn-sm" style={page >= totalPages ? { opacity: 0.4 } : {}} onClick={() => page < totalPages && fetchList(page + 1)}>下一页</Text>
        </View>
      )}
    </View>
  )
}
