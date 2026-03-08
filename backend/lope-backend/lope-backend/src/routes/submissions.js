const router = require('express').Router()
const auth   = require('../middleware/auth')
const { submissions, campaigns, stories } = require('../lib/db')

router.get('/', auth, (req, res) => {
  const { status, campaignId } = req.query
  res.json(submissions.all(req.brand.id, { status, campaignId: campaignId ? parseInt(campaignId) : undefined }))
})

router.patch('/:id', auth, (req, res) => {
  const id = parseInt(req.params.id)
  const { status } = req.body
  if (!['pending','approved','rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
  // Ownership check
  const sub = submissions.byId(id)
  if (!sub) return res.status(404).json({ error: 'Not found' })
  const allSubs = submissions.all(req.brand.id)
  if (!allSubs.find(s => s.id === id)) return res.status(403).json({ error: 'Forbidden' })
  const updated = submissions.update(id, { status })
  // Create story on approval
  if (status === 'approved' && !stories.bySubmissionId(id)) {
    const camp = campaigns.byId(sub.campaignId || sub.campaign_id)
    stories.create({ submissionId:id, campaignName:camp?.name||null, generatedMediaUrl:null, status:'processing' })
  }
  res.json(updated)
})

module.exports = router
