import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import s from './Auth.module.css'
export default function Login() {
  const{login}=useAuth(),toast=useToast(),navigate=useNavigate()
  const[f,setF]=useState({email:'',password:''}),[e,setE]=useState({}),[err,setErr]=useState(''),[l,setL]=useState(false)
  const upd=(k,v)=>{setF(p=>({...p,[k]:v}));setE(p=>({...p,[k]:''}));setErr('')}
  async function sub(ev){ev.preventDefault();const er={};if(!f.email)er.email='Required';if(!f.password)er.password='Required';if(Object.keys(er).length){setE(er);return};setL(true);const r=await login(f.email,f.password);setL(false);r.ok?(toast.success('Welcome back!'),navigate('/dashboard')):setErr(r.error)}
  return(<div className={s.shell}><div className={s.card}><div className={s.logo}><div className={s.mark}><div className={s.mL}/><div className={s.mB}/><div className={s.mD}/></div><span className={s.logoText}>LOPE</span></div><h1 className={s.heading}>Welcome back</h1><p className={s.sub}>Sign in to your brand dashboard</p>{err&&<div className={s.err}>{err}</div>}<form onSubmit={sub} noValidate><div className="form-group"><label className="form-label">Email *</label><input className={`form-input${e.email?' error':''}`} type="email" placeholder="you@brand.com" value={f.email} onChange={v=>upd('email',v.target.value)}/>{e.email&&<div className="form-error">{e.email}</div>}</div><div className="form-group"><label className="form-label">Password *</label><input className={`form-input${e.password?' error':''}`} type="password" placeholder="••••••••" value={f.password} onChange={v=>upd('password',v.target.value)}/>{e.password&&<div className="form-error">{e.password}</div>}</div><Button type="submit" size="lg" fullWidth loading={l}>Sign in</Button></form><div className={s.sw}>No account? <Link to="/register" className={s.swLink}>Create one</Link></div><div className={s.demo}><strong>Demo:</strong> demo@lope.com / password123</div></div></div>)
}
