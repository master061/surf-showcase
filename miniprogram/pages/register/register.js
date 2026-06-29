const { callFunction } = require('../../utils/api')
const app = getApp()
Page({
  data: { name:'', email:'', password:'', studentId:'', institution:'', yearIdx:3, error:'', loading:false, years:['2022','2023','2024','2025','2026','2027'] },
  onInput(e){const k=e.currentTarget.dataset.field;this.setData({[k]:e.detail.value})},
  onYearChange(e){this.setData({yearIdx:Number(e.detail.value)})},
  submit(){
    const d=this.data;if(!d.name||!d.email||!d.password){this.setData({error:'请填写必填项'});return}
    if(d.password.length<6){this.setData({error:'密码至少6位'});return}
    this.setData({loading:true,error:''})
    callFunction('register',{name:d.name,email:d.email,password:d.password,studentId:d.studentId,institution:d.institution,year:d.years[d.yearIdx]}).then(r=>{
      const user={...r.user,_id:r.user._id||r.user.id}
      app.globalData.user=user;app.globalData.token=r.token
      wx.setStorageSync('user',JSON.stringify(user));wx.setStorageSync('token',r.token)
      wx.showToast({title:'注册成功',icon:'success'});wx.switchTab({url:'/pages/index/index'})
    }).catch(e=>{this.setData({error:e?.data?.error||'注册失败'})}).finally(()=>this.setData({loading:false}))
  },
  goLogin(){wx.navigateTo({url:'/pages/login/login'})},
})
