const { campaigns, submissions } = require('../lib/db')
const { setCors, handleOptions, requireAuth } = require('../lib/middleware')

module.exports = async function(req, res) {
  if (handleOptions(req, res)) return; setCors(res)
  // Guard: 'public' is handled by public/[slug].js
  if (req.query.id === 'public') return res.status(404).json({ error:'Not found' })
  const user = requireAuth(req, res); if (!user) return
  const id = parseInt(req.query.id)
  const camp = await campaigns.byId(id)
  if (!camp || camp.brandId !== user.id) return res.status(404).json({ error:'Campaign not found' })

  if (req.method === 'PATCH') {
    try {
      const { name, description, status, startDate, endDate, moderationType, customFields, coverColor } = req.body
      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) return res.status(400).json({ error:'End date must be after start date' })
      res.json(await campaigns.update(id, { name, description, status, startDate, endDate, moderationType, customFields, coverColor }))
    } catch(e) { res.status(500).json({ error:e.message }) }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const count = await submissions.countByCampaign(id)
      if (count > 0) return res.status(409).json({ error:`Cannot delete — campaign has ${count} submissions` })
      await campaigns.delete(id)
      res.json({ message:'Campaign deleted' })
    } catch(e) { res.status(500).json({ error:e.message }) }
    return
  }

  res.status(405).end()
}
