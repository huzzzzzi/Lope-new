const { campaigns, submissions, stories } = require('../../../lib/db')
const { setCors, handleOptions } = require('../../../lib/middleware')

// No file handling here — files go directly to Cloudinary from the browser.
// This endpoint receives JSON: { name, contact, message, customAnswers, mediaUrl, mediaType }
module.exports = async function(req, res) {
  if (handleOptions(req, res)) return; setCors(res)
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const camp = await campaigns.bySlug(req.query.slug)
    if (!camp)                   return res.status(404).json({ error:'Campaign not found' })
    if (camp.status === 'ended') return res.status(410).json({ error:'Campaign has ended' })
    if (camp.status === 'draft') return res.status(403).json({ error:'Campaign not live' })

    const { name, contact, message, customAnswers, mediaUrl, mediaType } = req.body
    if (!name?.trim())    return res.status(400).json({ error:'Name required' })
    if (!contact?.trim()) return res.status(400).json({ error:'Email or phone required' })
    if (!mediaUrl)        return res.status(400).json({ error:'Media upload required' })

    const status = camp.moderationType === 'auto' ? 'approved' : 'pending'
    const sub = await submissions.create({ campaignId:camp.id, name:name.trim(), contact:contact.trim(), message:message?.trim()||null, customAnswers:customAnswers||{}, mediaUrl, mediaType:mediaType||'image', status })

    if (status === 'approved') {
      await stories.create({ submissionId:sub.id, campaignName:camp.name, generatedMediaUrl:null, status:'processing' })
    }

    res.status(201).json({ submission:{ id:sub.id, status:sub.status } })
  } catch(e) { console.error(e); res.status(500).json({ error:'Submission failed' }) }
}
