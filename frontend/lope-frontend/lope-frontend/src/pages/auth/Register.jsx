import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import s from './Auth.module.css'
export default function Register() {
  const{register}=useAuth(),toast=useToast(),navigate=useNavigate()
  const[f,setF]=useState({name:'',email:'',password:'',confirm:''}),[e,setE]=useState({}),[err,setErr]=useState(''),[l,setL]=useState(false)
  const upd=(k,v)=>{setF(p=>({...p,[k]:v}));setE(p=>({...p,[k]:''}));setErr('')}
  async function sub(ev){ev.preventDefault();const er={};if(!f.name.trim()||f.name.trim().length<2)er.name='2+ characters';if(!/\S+@\S+\.\S+/.test(f.email))er.email='Valid email required';if(f.password.length<8)er.password='8+ characters';if(f.password!==f.confirm)er.confirm='Do not match';if(Object.keys(er).length){setE(er);return};setL(true);const r=await register(f.name.trim(),f.email,f.password);setL(false);r.ok?(toast.success('Account created!'),navigate('/dashboard')):setErr(r.error)}
  return(<div className={s.shell}><div className={s.card}><div className={s.logo}><div className={s.mark}><div className={s.mL}/><div className={s.mB}/><div className={s.mD}/></div><span className={s.logoText}>LOPE</span></div><h1 className={s.heading}>Create your brand</h1><p className={s.sub}>Start collecting UGC in minutes</p>{err&&<div className={s.err}>{err}</div>}<form onSubmit={sub} noValidate>{[{k:'name',l:'Brand Name',t:'text',p:'e.g. Nike'},{k:'email',l:'Email',t:'email',p:'you@brand.com'},{k:'password',l:'Password',t:'password',p:'Min 8 characters'},{k:'confirm',l:'Confirm Password',t:'password',p:'Repeat'}].map(({k,l,t,p})=>(<div className="form-group" key={k}><label className="form-label">{l} *</label><input className={`form-input${e[k]?' error':''}`} type={t} placeholder={p} value={f[k]} onChange={v=>upd(k,v.target.value)}/>{e[k]&&<div className="form-error">{e[k]}</div>}</div>))}<Button type="submit" size="lg" fullWidth loading={l}>Create account</Button></form><div className={s.sw}>Have an account? <Link to="/login" className={s.swLink}>Sign in</Link></div></div></div>)
}
