const { callFunction } = require('../../utils/api')
const app = getApp()
Page({
  data: { name: app.globalData.user?.name || '', studentId: '', institution: '', yearIdx: 3, error: '', loading: false, years: ['2022','2023','2024','2025','2026','2027'] },
  onInput(e){this.setData({[e.currentTarget.dataset.field]:e.detail.value})},
  onYearChange(e){this.setData({yearIdx:Number(e.detail.value)})},
  submit(){
    if(!this.data.name){this.setData({error:'请输入姓名'});return}
    this.setData({loading:true,error:''})
    callFunction('updateProfile',{data:{name:this.data.name,studentId:this.data.studentId,institution:this.data.institution,year:this.data.years[this.data.yearIdx]}}).then(u=>{
      const user={...u,_id:u._id||u.id}
      app.globalData.user=user;wx.setStorageSync('user',JSON.stringify(user))
      wx.showToast({title:'信息已保存',icon:'success'});wx.switchTab({url:'/pages/index/index'})
    }).catch(e=>{this.setData({error:e?.data?.error||'保存失败'})}).finally(()=>this.setData({loading:false}))
  },
})
