const { callFunction, fields: fieldList } = require('../../utils/api')
const app = getApp()

const ICON_MAP = {
  '计算机科学':'💻','人工智能':'🤖','生物医药':'🧬','物理数学':'📐',
  '化学材料':'🧪','工程技术':'⚙️','社会科学':'🏛️','人文艺术':'🎨'
}
const FIELD_COLORS = ['#F5F3EF','#EBEFE2','#F5EDE4','#E8EBF2','#F2EFE0','#EDE8F0','#E0F0EA','#F2E8E8']

Page({
  data: {
    hotProjects:[], latestProjects:[], recruitProjects:[], loading:true, user:null, unreadCount:0, announcements:[],
    fieldList: fieldList.map(f => ({ name: f, icon: ICON_MAP[f] || '📁' })),
    fieldColors: FIELD_COLORS,
    stats:{projects:0,recruitCount:0,fields:8}
  },
  onShow(){
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.setData({user:app.globalData.user})
    Promise.all([
      callFunction('getProjects',{sort:'hot',limit:5}),
      callFunction('getProjects',{sort:'newest',limit:3}),
      callFunction('getProjects',{status:'RECRUITING',limit:5}),
      callFunction('getUnreadCount').catch(()=>({count:0})),
      callFunction('getAnnouncements').catch(()=>({announcements:[]})),
      callFunction('getFields').catch(()=>({fields:[]})),
      callFunction('getPublicStats').catch(()=>({totalProjects:0,totalUsers:0,totalVotes:0})),
    ]).then(([hot,latest,recruit,unread,ann,fields,pStats])=>{
      const fm = (fields?.fields||[]).map(f => ({ name: f.name || f, icon: f.icon || ICON_MAP[f.name] || '📁' }))
      this.setData({
        fieldList: fm,
        fieldColors: fm.map((_,i)=>FIELD_COLORS[i % FIELD_COLORS.length]),
        hotProjects:hot.projects,
        latestProjects:latest.projects,
        recruitProjects:recruit.projects,
        loading:false,
        'stats.projects':pStats?.totalProjects||hot.total,
        'stats.recruitCount':recruit.total,
        'stats.fields':fm.length,
        'stats.users':pStats?.totalUsers||0,
        'stats.votes':pStats?.totalVotes||0,
        unreadCount:unread?.count||0,
        announcements:ann?.announcements||[]
      })
    }).catch(()=>this.setData({loading:false}))
  },
  onPullDownRefresh(){
    this.onShow()
    setTimeout(() => wx.stopPullDownRefresh(), 1000)
  },
  goNotifications(){
    if (app.globalData.user) {
      wx.navigateTo({url:'/pages/notifications/notifications'})
    } else {
      wx.navigateTo({url:'/pages/login/login'})
    }
  },
  onAction(){
    if (app.globalData.user) {
      wx.navigateTo({url:'/pages/create/create'})
    } else {
      wx.navigateTo({url:'/pages/login/login'})
    }
  },
  goLogin(){wx.navigateTo({url:'/pages/login/login'})},
  goCreate(){wx.navigateTo({url:'/pages/create/create'})},
  goProjects(e){
    const field = e.currentTarget.dataset.field
    if (field) app.globalData.pendingField = field
    wx.switchTab({url:'/pages/projects/projects'})
  },
  goAnnouncements(){
    wx.navigateTo({url:'/pages/announcement/announcement'})
  },
  goProjectsWith(e){
    const ds = e.currentTarget.dataset
    if (ds.status) app.globalData.pendingStatus = ds.status
    if (ds.sort) app.globalData.pendingSort = ds.sort
    wx.switchTab({url:'/pages/projects/projects'})
  },
})
