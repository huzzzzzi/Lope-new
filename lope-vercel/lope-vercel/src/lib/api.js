const KEY = 'lope_token'
export const token = { get:()=>localStorage.getItem(KEY), set:t=>localStorage.setItem(KEY,t), clear:()=>localStorage.removeItem(KEY) }
async function req(method, url, body, pub=false) {
  const h = {}
  if (!(body instanceof FormData)) h['Content-Type']='application/json'
  if (!pub) { const t=token.get(); if(t) h['Authorization']='Bearer '+t }
  const r = await fetch('/api'+url, { method, headers:h, body: body instanceof FormData ? body : body!==undefined ? JSON.stringify(body) : undefined })
  if (r.status===204) return null
  const d = await r.json()
  if (!r.ok) { const e=new Error(d?.error||'Request failed'); e.status=r.status; throw e }
  return d
}
export const api = {
  get:    p    => req('GET',    p),
  post:   (p,b)=> req('POST',  p, b),
  patch:  (p,b)=> req('PATCH', p, b),
  delete: p    => req('DELETE', p),
  public: { get:p=>req('GET',p,undefined,true), post:(p,b)=>req('POST',p,b,true) },
}
