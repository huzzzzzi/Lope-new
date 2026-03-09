const { submissions, campaigns, stories } = require('../lib/db')
const { setCors, handleOptions, requireAuth } = require('../lib/middleware')
module.exports = async function(req, res) {
  if (handleOptions(req, res)) return; setCors(res)
  if (req.method !== 'PATCH') return res.status(405).end()
  const user = requireAuth(req, res); if (!user) return
  try {
    const id = parseInt(req.query.id)
    const { status } = req.body
    if (!['pending','approved','rejected'].includes(status)) return res.status(400).json({ error:'Invalid status' })
    const allSubs = await submissions.all(user.id)
    if (!allSubs.find(s => s.id === id)) return res.status(403).json({ error:'Forbidden' })
    const updated = await submissions.update(id, { status })
    if (status === 'approved' && !(await stories.bySubmissionId(id))) {
      const sub = await submissions.byId(id)
      const camp = await campaigns.byId(sub.campaignId)
      await stories.create({ submissionId:id, campaignName:camp?.name||null, generatedMediaUrl:null, status:'processing' })
    }
    res.json(updated)
  } catch(e) { res.status(500).json({ error:e.message }) }
}
