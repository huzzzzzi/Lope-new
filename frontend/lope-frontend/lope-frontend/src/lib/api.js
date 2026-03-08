const TOKEN_KEY = 'lope_token'
export const token = {
  get:   ()  => localStorage.getItem(TOKEN_KEY),
  set:   (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: ()  => localStorage.removeItem(TOKEN_KEY),
}
async function request(method, url, body, isPublic=false) {
  const headers = {}
  if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json'
  if (!isPublic) { const t=token.get(); if(t) headers['Authorization']='Bearer '+t }
  const res = await fetch('/api'+url, { method, headers, body: body instanceof FormData ? body : body!==undefined ? JSON.stringify(body) : undefined })
  if (res.status===204) return null
  const data = await res.json()
  if (!res.ok) { const e=new Error(data?.error||'Request failed'); e.status=res.status; throw e }
  return data
}
export const api = {
  get:    p    => request('GET',    p),
  post:   (p,b)=> request('POST',   p, b),
  patch:  (p,b)=> request('PATCH',  p, b),
  delete: p    => request('DELETE', p),
  public: { get:(p)=>request('GET',p,undefined,true), post:(p,b)=>request('POST',p,b,true) },
}
