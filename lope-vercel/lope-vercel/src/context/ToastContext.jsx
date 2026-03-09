import { createContext, useContext, useState, useCallback } from 'react'
const Ctx=createContext(null); let _id=0
export function ToastProvider({children}){
  const [toasts,setToasts]=useState([])
  const add=useCallback((msg,type='info',dur=3000)=>{ const id=++_id; setToasts(p=>[...p,{id,msg,type}]); setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),dur) },[])
  const t={success:(m,d)=>add(m,'success',d),error:(m,d)=>add(m,'error',d||4500),info:(m,d)=>add(m,'info',d)}
  return(<Ctx.Provider value={t}>{children}<div className="toast-container">{toasts.map(({id,msg,type})=>(<div key={id} className={`toast toast-${type}`} onClick={()=>setToasts(p=>p.filter(t=>t.id!==id))}>{type==='success'?'✓':type==='error'?'✕':'ℹ'} {msg}</div>))}</div></Ctx.Provider>)
}
export const useToast=()=>useContext(Ctx)
