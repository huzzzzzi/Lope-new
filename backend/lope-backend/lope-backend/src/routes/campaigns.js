const router = require('express').Router()
const multer = require('multer')
const path   = require('path')
const auth   = require('../middleware/auth')
const { campaigns, submissions, stories, rateLimit } = require('../lib/db')

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
    filename:    (req, file, cb) => cb(null, Date.now()+'-'+Math.random().toString(36).slice(2)+path.extname(file.originalname)),
  }),
  limits: { fileSize: 20*1024*1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp','video/mp4','video/quicktime'].includes(file.mimetype)
    cb(ok ? null : new Error('Unsupported file type'), ok)
  },
})

// GET /api/campaigns
router.get('/', auth, (req, res) => res.json(campaigns.all(req.brand.id, req.query.status)))

// POST /api/campaigns
router.post('/', auth, (req, res) => {
  const { name, description, startDate, endDate, moderationType, customFields, coverColor } = req.body
  if (!name?.trim())  return res.status(400).json({ error: 'Campaign name required' })
  if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end date required' })
  if (new Date(startDate) >= new Date(endDate)) return res.status(400).json({ error: 'End date must be after start date' })
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
  let slug=base, n=0
  while(campaigns.slugTaken(slug)) slug=base+'-'+(++n)
  res.status(201).json(campaigns.create({ brandId:req.brand.id, name:name.trim(), description:description?.trim()||null, slug, status:'draft', startDate, endDate, moderationType:moderationType||'manual', customFields:customFields||[], coverColor:coverColor||'#1c4a3b' }))
})

// PATCH /api/campaigns/:id
router.patch('/:id', auth, (req, res) => {
  const camp = campaigns.byId(parseInt(req.params.id))
  if (!camp || camp.brandId !== req.brand.id) return res.status(404).json({ error: 'Campaign not found' })
  const { name, description, status, startDate, endDate, moderationType, customFields, coverColor } = req.body
  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) return res.status(400).json({ error: 'End date must be after start date' })
  res.json(campaigns.update(camp.id, { name, description, status, startDate, endDate, moderationType, customFields, coverColor }))
})

// DELETE /api/campaigns/:id
router.delete('/:id', auth, (req, res) => {
  const camp = campaigns.byId(parseInt(req.params.id))
  if (!camp || camp.brandId !== req.brand.id) return res.status(404).json({ error: 'Campaign not found' })
  const subCount = submissions.countByCampaign(camp.id)
  if (subCount > 0) return res.status(409).json({ error: `Cannot delete — campaign has ${subCount} submissions` })
  campaigns.delete(camp.id)
  res.json({ message: 'Campaign deleted' })
})

// GET /api/campaigns/public/:slug  (no auth)
router.get('/public/:slug', (req, res) => {
  const c = campaigns.bySlug(req.params.slug)
  if (!c)                  return res.status(404).json({ error: 'Campaign not found' })
  if (c.status === 'ended') return res.status(410).json({ error: 'Campaign has ended' })
  if (c.status === 'draft') return res.status(403).json({ error: 'Campaign not yet live' })
  const count = submissions.countByCampaign(c.id)
  const { brandId:_, ...safe } = c
  res.json({ campaign: { ...safe, submissionCount: count } })
})

// POST /api/campaigns/public/:slug/submit  (no auth — rate limited)
router.post('/public/:slug/submit', upload.single('file'), (req, res) => {
  try {
    // Rate limit: 5 submissions per IP per minute
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
    if (!rateLimit.check('submit:'+ip, 5, 60000)) return res.status(429).json({ error: 'Too many submissions. Please wait a minute.' })

    const c = campaigns.bySlug(req.params.slug)
    if (!c)                  return res.status(404).json({ error: 'Campaign not found' })
    if (c.status === 'ended') return res.status(410).json({ error: 'Campaign has ended' })
    if (c.status === 'draft') return res.status(403).json({ error: 'Campaign not live' })

    const { name, contact, message } = req.body
    if (!name?.trim())    return res.status(400).json({ error: 'Name required' })
    if (!contact?.trim()) return res.status(400).json({ error: 'Email or phone required' })
    if (!req.file)        return res.status(400).json({ error: 'Photo or video required' })

    const customAnswers = req.body.customAnswers ? JSON.parse(req.body.customAnswers) : {}
    const mediaUrl  = '/uploads/'+req.file.filename
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image'
    const status    = c.moderationType === 'auto' ? 'approved' : 'pending'

    const sub = submissions.create({ campaignId:c.id, name:name.trim(), contact:contact.trim(), message:message?.trim()||null, customAnswers, mediaUrl, mediaType, status })

    if (status === 'approved') {
      stories.create({ submissionId:sub.id, campaignName:c.name, generatedMediaUrl:null, status:'processing' })
    }

    res.status(201).json({ submission: { id:sub.id, status:sub.status } })
  } catch(e) { console.error(e); res.status(500).json({ error: 'Submission failed' }) }
})

module.exports = router
