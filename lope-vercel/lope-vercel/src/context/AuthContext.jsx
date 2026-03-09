import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, token } from '../lib/api'
const Ctx = createContext(null)
export function AuthProvider({ children }) {
  const [brand,setBrand]=useState(null),[loading,setLoading]=useState(true)
  useEffect(()=>{ if(!token.get()){setLoading(false);return} api.get('/auth/me').then(d=>setBrand(d.brand)).catch(()=>token.clear()).finally(()=>setLoading(false)) },[])
  const login    = useCallback(async(email,password)=>{ try{const d=await api.post('/auth/login',{email,password});token.set(d.token);setBrand(d.brand);return{ok:true}}catch(e){return{ok:false,error:e.message}} },[])
  const register = useCallback(async(name,email,password)=>{ try{const d=await api.post('/auth/register',{name,email,password});token.set(d.token);setBrand(d.brand);return{ok:true}}catch(e){return{ok:false,error:e.message}} },[])
  const logout      = useCallback(()=>{token.clear();setBrand(null)},[])
  const updateBrand = useCallback(u=>setBrand(p=>p?{...p,...u}:p),[])
  return <Ctx.Provider value={{brand,loading,login,register,logout,updateBrand}}>{children}</Ctx.Provider>
}
export const useAuth=()=>useContext(Ctx)
