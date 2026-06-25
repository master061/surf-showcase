const { callFunction, fields, types, typeValues, years, typeLabels } = require('../../utils/api')
Page({
  data: { list:[], loading:true, search:'', fieldIdx:0, typeIdx:0, yearIdx:0, statusVal:'', sort:'newest',
    page:1, totalPages:1, fields, types, years, typeLabels, typeValues,
    statuses:[{label:'全部',value:''},{label:'✅ 已完成',value:'COMPLETED'},{label:'🔍 招人中',value:'RECRUITING'}],
    suggestions:{titles:[],tags:[],studentNames:[],fields:[]}, showSug:false, sugTimer:null },
  onLoad(params){
    const app = getApp()
    if (app.globalData.pendingStatus) { this.setData({ statusVal: app.globalData.pendingStatus }); app.globalData.pendingStatus = '' }
    if (app.globalData.pendingSort) { this.setData({ sort: app.globalData.pendingSort }); app.globalData.pendingSort = '' }
    if (app.globalData.pendingField) { this.setData({ search: app.globalData.pendingField }); app.globalData.pendingField = '' }
    if(params.status) this.setData({statusVal:params.status})
    if(params.sort) this.setData({sort:params.sort})
    if(params.field) this.setData({search:params.field})
    this.fetchList(1)
  },
  onShow(){
    const app = getApp()
    if (app.globalData.pendingField) {
      this.setData({ search: app.globalData.pendingField, fieldIdx: 0, typeIdx: 0, yearIdx: 0, statusVal: '' })
      app.globalData.pendingField = ''
      this.fetchList(1)
    }
    if (app.globalData.pendingStatus) {
      this.setData({ statusVal: app.globalData.pendingStatus, search: '', fieldIdx: 0, typeIdx: 0, yearIdx: 0 })
      app.globalData.pendingStatus = ''
      this.fetchList(1)
    }
    if (app.globalData.pendingSort) {
      this.setData({ sort: app.globalData.pendingSort, search: '', fieldIdx: 0, typeIdx: 0, yearIdx: 0, statusVal: '' })
      app.globalData.pendingSort = ''
      this.fetchList(1)
    }
  },
  fetchList(p){
    this.setData({loading:true,page:p||1})
    const d=this.data
    callFunction('getProjects',{
      page:d.page, sort:d.sort,
      field:d.fieldIdx>0?d.fields[d.fieldIdx]:undefined,
      type:d.typeIdx>0?d.typeValues[d.typeIdx]:undefined,
      year:d.yearIdx>0?d.years[d.yearIdx]:undefined,
      status:d.statusVal||undefined, search:d.search||undefined,
    }).then(r=>{
      this.setData({list:r.projects,page:r.page,totalPages:r.totalPages,loading:false})
    }).catch(()=>this.setData({loading:false}))
  },
  onSearchInput(e){
    const v=e.detail.value;this.setData({search:v})
    if(v.length>=1){
      clearTimeout(this.data.sugTimer)
      const t=setTimeout(()=>{callFunction('getSuggestions',{q:v}).then(s=>this.setData({suggestions:s,showSug:true})).catch(()=>{})},300)
      this.setData({sugTimer:t})
    }else{this.setData({showSug:false,suggestions:{titles:[],tags:[],studentNames:[],fields:[]}})}
  },
  onSearchConfirm(){this.setData({showSug:false});this.fetchList(1)},
  onSugClick(e){this.setData({search:e.currentTarget.dataset.value,showSug:false});this.fetchList(1)},
  onStatusTap(e){this.setData({statusVal:e.currentTarget.dataset.value});this.fetchList(1)},
  onFieldTap(e){
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({fieldIdx:idx,search:''});this.fetchList(1)
  },
  onFieldChange(e){this.setData({fieldIdx:Number(e.detail.value)});this.fetchList(1)},
  onTypeChange(e){this.setData({typeIdx:Number(e.detail.value)});this.fetchList(1)},
  onYearChange(e){this.setData({yearIdx:Number(e.detail.value)});this.fetchList(1)},
  setSort(e){this.setData({sort:e.currentTarget.dataset.sort});this.fetchList(1)},
  prevPage(){if(this.data.page>1)this.fetchList(this.data.page-1)},
  nextPage(){if(this.data.page<this.data.totalPages)this.fetchList(this.data.page+1)},
})
