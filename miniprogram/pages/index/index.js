const { callFunction, fields: fieldList } = require('../../utils/api')
const app = getApp()
Page({
  data: { hotProjects:[], latestProjects:[], recruitProjects:[], loading:true, user:null, unreadCount:0, fields:fieldList,
    fieldIcons:['💻','🤖','🧬','📐','🧪','⚙️','🏛️','🎨'],
    fieldColors:['#eff6ff','#f0fdf4','#fef2f2','#f5f3ff','#fefce8','#fff7ed','#ecfeff','#fdf2f8'],
    stats:{projects:0,recruitCount:0,fields:8} },
  onShow(){
    this.setData({user:app.globalData.user})
    Promise.all([
      callFunction('getProjects',{sort:'hot',limit:5}),
      callFunction('getProjects',{sort:'newest',limit:3}),
      callFunction('getProjects',{status:'RECRUITING',limit:5}),
      callFunction('getUnreadCount').catch(()=>({count:0})),
    ]).then(([hot,latest,recruit,unread])=>{
      this.setData({hotProjects:hot.projects,latestProjects:latest.projects,recruitProjects:recruit.projects,loading:false,
        'stats.projects':hot.total,'stats.recruitCount':recruit.total, unreadCount:unread?.count||0})
    }).catch(()=>this.setData({loading:false}))
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
  goProjectsWith(e){
    const ds = e.currentTarget.dataset
    if (ds.status) app.globalData.pendingStatus = ds.status
    if (ds.sort) app.globalData.pendingSort = ds.sort
    wx.switchTab({url:'/pages/projects/projects'})
  },
})
