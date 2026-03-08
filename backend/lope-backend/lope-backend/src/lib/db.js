// Pure JSON file database — works on all platforms, no compilation needed.
// Data persists in data/db.json between restarts.
const fs   = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const DB_PATH = path.join(__dirname, '../../data/db.json')

// ── Seed ─────────────────────────────────────────────────────────────────────
function makeSeed() {
  const hash = bcrypt.hashSync('password123', 12)
  return {
    _seq: { brands:1, campaigns:3, submissions:4, stories:1 },
    brands: [{ id:1, name:'Demo Brand', email:'demo@lope.com', password_hash:hash, created_at:ts(), updated_at:ts() }],
    campaigns: [
      { id:1, brand_id:1, name:'Summer Run 2025', description:'Share your best running moments!', slug:'summer-run-2025', status:'live', start_date:'2025-06-01', end_date:'2025-08-31', moderation_type:'manual', custom_fields:JSON.stringify([{id:'pace',label:'Your pace?',type:'text',required:false,placeholder:'5:30/km'},{id:'location',label:'Where did you run?',type:'text',required:false,placeholder:'Central Park'}]), cover_color:'#1c4a3b', created_at:ts(), updated_at:ts() },
      { id:2, brand_id:1, name:'Win the Court',   description:'Show us your best moves.', slug:'win-the-court', status:'live', start_date:'2025-05-10', end_date:'2025-07-15', moderation_type:'ai',     custom_fields:'[]', cover_color:'#2d4fa8', created_at:ts(), updated_at:ts() },
      { id:3, brand_id:1, name:'Just Flow — Yoga',description:null, slug:'just-flow-yoga', status:'ended', start_date:'2025-04-01', end_date:'2025-04-30', moderation_type:'auto',   custom_fields:'[]', cover_color:'#7a3b8c', created_at:ts(), updated_at:ts() },
    ],
    submissions: [
      { id:1, campaign_id:1, name:'Maria Kowalski', contact:'maria@gmail.com', message:'Best run ever!', custom_answers:JSON.stringify({pace:'4:42/km',location:'Central Park'}), media_url:'https://placehold.co/600x400/e6f2ee/1c4a3b?text=Summer+Run', media_type:'image', status:'approved', created_at:ts(), updated_at:ts() },
      { id:2, campaign_id:1, name:'James Rivera',   contact:'james@email.com', message:null, custom_answers:'{}', media_url:'https://placehold.co/600x400/fdf3dc/e8a838?text=Running', media_type:'image', status:'pending',  created_at:ts(), updated_at:ts() },
      { id:3, campaign_id:2, name:'Anya Bassi',     contact:'+1 555 0123',    message:null, custom_answers:'{}', media_url:'https://placehold.co/600x400/fff1f1/d64e2a?text=Court',   media_type:'image', status:'pending',  created_at:ts(), updated_at:ts() },
      { id:4, campaign_id:1, name:'Sophie Chen',    contact:'sophie@email.com',message:'Amazing!', custom_answers:JSON.stringify({pace:'5:10/km',location:'Golden Gate Park'}), media_url:'https://placehold.co/600x400/e6f2ee/1c4a3b?text=Run+2', media_type:'image', status:'pending', created_at:ts(), updated_at:ts() },
    ],
    stories: [
      { id:1, submission_id:1, campaign_name:'Summer Run 2025', generated_media_url:'https://placehold.co/400x700/1c4a3b/ffffff?text=Story+%231', status:'completed', created_at:ts(), updated_at:ts() },
    ],
  }
}

function ts() { return new Date().toISOString() }
function read() {
  try { return fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH,'utf8')) : write(makeSeed()) }
  catch { return write(makeSeed()) }
}
function write(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive:true })
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
  return db
}
const nextId = (db, t) => { db._seq[t]=(db._seq[t]||0)+1; return db._seq[t] }

// ── parsers ───────────────────────────────────────────────────────────────────
function parseCampaign(c) {
  if(!c) return null
  return { id:c.id, brandId:c.brand_id, name:c.name, description:c.description, slug:c.slug, status:c.status, startDate:c.start_date, endDate:c.end_date, moderationType:c.moderation_type, customFields:JSON.parse(c.custom_fields||'[]'), coverColor:c.cover_color, createdAt:c.created_at, updatedAt:c.updated_at }
}
function parseSub(s) {
  if(!s) return null
  return { id:s.id, campaignId:s.campaign_id, name:s.name, contact:s.contact, message:s.message, customAnswers:JSON.parse(s.custom_answers||'{}'), mediaUrl:s.media_url, mediaType:s.media_type, status:s.status, createdAt:s.created_at, updatedAt:s.updated_at }
}
function parseStory(s) {
  if(!s) return null
  return { id:s.id, submissionId:s.submission_id, campaignName:s.campaign_name, generatedMediaUrl:s.generated_media_url, status:s.status, createdAt:s.created_at, updatedAt:s.updated_at }
}

// ── brands ────────────────────────────────────────────────────────────────────
const brands = {
  byEmail: e  => { const db=read(); return db.brands.find(b=>b.email===e.toLowerCase())||null },
  byId:    id => { const db=read(); return db.brands.find(b=>b.id===id)||null },
  create(data) {
    const db=read(), b={ id:nextId(db,'brands'), name:data.name, email:data.email.toLowerCase(), password_hash:data.passwordHash, created_at:ts(), updated_at:ts() }
    db.brands.push(b); write(db); return b
  },
  update(id, data) {
    const db=read(), i=db.brands.findIndex(b=>b.id===id); if(i<0)return null
    if(data.name)         db.brands[i].name          = data.name
    if(data.email)        db.brands[i].email         = data.email.toLowerCase()
    if(data.passwordHash) db.brands[i].password_hash = data.passwordHash
    db.brands[i].updated_at = ts(); write(db); return db.brands[i]
  },
}

// ── campaigns ─────────────────────────────────────────────────────────────────
const campaigns = {
  all(brandId, status) {
    const db=read()
    return db.campaigns
      .filter(c=>c.brand_id===brandId&&(!status||c.status===status))
      .sort((a,b)=>b.created_at.localeCompare(a.created_at))
      .map(c=>({ ...parseCampaign(c), _count:{ submissions: db.submissions.filter(s=>s.campaign_id===c.id).length } }))
  },
  bySlug:    s  => { const db=read(); return parseCampaign(db.campaigns.find(c=>c.slug===s)||null) },
  byId:      id => { const db=read(); return parseCampaign(db.campaigns.find(c=>c.id===id)||null) },
  slugTaken: s  => read().campaigns.some(c=>c.slug===s),
  submissionCount: id => read().submissions.filter(s=>s.campaign_id===id).length,
  create(data) {
    const db=read()
    const c={ id:nextId(db,'campaigns'), brand_id:data.brandId, name:data.name, description:data.description||null, slug:data.slug, status:data.status||'draft', start_date:data.startDate, end_date:data.endDate, moderation_type:data.moderationType||'manual', custom_fields:JSON.stringify(data.customFields||[]), cover_color:data.coverColor||'#1c4a3b', created_at:ts(), updated_at:ts() }
    db.campaigns.push(c); write(db); return parseCampaign(c)
  },
  update(id, data) {
    const db=read(), i=db.campaigns.findIndex(c=>c.id===id); if(i<0)return null
    const c=db.campaigns[i]
    if(data.name!==undefined)           c.name            = data.name
    if(data.description!==undefined)    c.description     = data.description
    if(data.status!==undefined)         c.status          = data.status
    if(data.startDate!==undefined)      c.start_date      = data.startDate
    if(data.endDate!==undefined)        c.end_date        = data.endDate
    if(data.moderationType!==undefined) c.moderation_type = data.moderationType
    if(data.customFields!==undefined)   c.custom_fields   = JSON.stringify(data.customFields)
    if(data.coverColor!==undefined)     c.cover_color     = data.coverColor
    c.updated_at=ts(); write(db); return parseCampaign(c)
  },
  delete(id) { const db=read(); db.campaigns=db.campaigns.filter(c=>c.id!==id); write(db) },
}

// ── submissions ───────────────────────────────────────────────────────────────
const submissions = {
  all(brandId, { status, campaignId }={}) {
    const db=read()
    const cids=new Set(db.campaigns.filter(c=>c.brand_id===brandId).map(c=>c.id))
    return db.submissions
      .filter(s=>cids.has(s.campaign_id)&&(!status||s.status===status)&&(!campaignId||s.campaign_id===campaignId))
      .sort((a,b)=>b.created_at.localeCompare(a.created_at))
      .map(s=>{ const camp=db.campaigns.find(c=>c.id===s.campaign_id); return { ...parseSub(s), campaign:camp?{id:camp.id,name:camp.name,slug:camp.slug}:null } })
  },
  byId: id => { const db=read(); return parseSub(db.submissions.find(s=>s.id===id)||null) },
  countByCampaign: id => read().submissions.filter(s=>s.campaign_id===id).length,
  create(data) {
    const db=read()
    const s={ id:nextId(db,'submissions'), campaign_id:data.campaignId, name:data.name, contact:data.contact, message:data.message||null, custom_answers:JSON.stringify(data.customAnswers||{}), media_url:data.mediaUrl, media_type:data.mediaType||'image', status:data.status||'pending', created_at:ts(), updated_at:ts() }
    db.submissions.push(s); write(db); return parseSub(s)
  },
  update(id, data) {
    const db=read(), i=db.submissions.findIndex(s=>s.id===id); if(i<0)return null
    if(data.status!==undefined) db.submissions[i].status=data.status
    db.submissions[i].updated_at=ts(); write(db); return parseSub(db.submissions[i])
  },
}

// ── stories ───────────────────────────────────────────────────────────────────
const stories = {
  all(brandId, { status, limit }={}) {
    const db=read()
    const cids=new Set(db.campaigns.filter(c=>c.brand_id===brandId).map(c=>c.id))
    const sids=new Set(db.submissions.filter(s=>cids.has(s.campaign_id)).map(s=>s.id))
    let list=db.stories.filter(s=>sids.has(s.submission_id)&&(!status||s.status===status)).sort((a,b)=>b.created_at.localeCompare(a.created_at))
    if(limit) list=list.slice(0,limit)
    return list.map(s=>{
      const sub=db.submissions.find(x=>x.id===s.submission_id)
      return { ...parseStory(s), submissionName:sub?.name||null, sourceMediaUrl:sub?.media_url||null }
    })
  },
  bySubmissionId: id => { const db=read(); return parseStory(db.stories.find(s=>s.submission_id===id)||null) },
  byId:           id => { const db=read(); return parseStory(db.stories.find(s=>s.id===id)||null) },
  create(data) {
    const db=read()
    const s={ id:nextId(db,'stories'), submission_id:data.submissionId, campaign_name:data.campaignName||null, generated_media_url:data.generatedMediaUrl||null, status:data.status||'processing', created_at:ts(), updated_at:ts() }
    db.stories.push(s); write(db); return parseStory(s)
  },
  update(id, data) {
    const db=read(), i=db.stories.findIndex(s=>s.id===id); if(i<0)return null
    if(data.status!==undefined)            db.stories[i].status=data.status
    if(data.generatedMediaUrl!==undefined) db.stories[i].generated_media_url=data.generatedMediaUrl
    db.stories[i].updated_at=ts(); write(db); return parseStory(db.stories[i])
  },
}

// ── stats ─────────────────────────────────────────────────────────────────────
const stats = {
  get(brandId) {
    const db=read()
    const bc=db.campaigns.filter(c=>c.brand_id===brandId)
    const cids=new Set(bc.map(c=>c.id))
    const bs=db.submissions.filter(s=>cids.has(s.campaign_id))
    const sids=new Set(bs.map(s=>s.id))
    const st=db.stories.filter(s=>sids.has(s.submission_id))
    return {
      campaigns:   { total:bc.length, active:bc.filter(c=>c.status==='live').length, ended:bc.filter(c=>c.status==='ended').length, draft:bc.filter(c=>c.status==='draft').length },
      submissions: { total:bs.length, pending:bs.filter(s=>s.status==='pending').length, approved:bs.filter(s=>s.status==='approved').length, rejected:bs.filter(s=>s.status==='rejected').length },
      stories:     { total:st.length, completed:st.filter(s=>s.status==='completed').length, processing:st.filter(s=>s.status==='processing').length },
    }
  },
}

// ── rate limiter ──────────────────────────────────────────────────────────────
const _rl=new Map()
const rateLimit = {
  check(key,max=5,windowMs=60000) {
    const now=Date.now(), hits=(_rl.get(key)||[]).filter(t=>now-t<windowMs)
    hits.push(now); _rl.set(key,hits); return hits.length<=max
  },
}

console.log('  Database ready (JSON file store)')

module.exports = { brands, campaigns, submissions, stories, stats, rateLimit }
