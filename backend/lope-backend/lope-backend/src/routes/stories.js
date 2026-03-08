const router = require('express').Router()
const auth   = require('../middleware/auth')
const { stories } = require('../lib/db')

router.get('/', auth, (req, res) => {
  const { status, limit } = req.query
  res.json(stories.all(req.brand.id, { status, limit: limit ? parseInt(limit) : undefined }))
})

// POST /api/stories/:id/generate  — mock AI generation
router.post('/:id/generate', auth, (req, res) => {
  const story = stories.byId(parseInt(req.params.id))
  if (!story) return res.status(404).json({ error: 'Story not found' })

  // In production: call Replicate / fal.ai / DALL-E here
  // For now: simulate a 2-second "generation" and return a placeholder
  setTimeout(() => {
    const colors = ['1c4a3b/ffffff','2d4fa8/ffffff','7a3b8c/ffffff','e8a838/18180f','d64e2a/ffffff']
    const color  = colors[story.id % colors.length]
    const url    = `https://placehold.co/400x700/${color}?text=Story+%23${story.id}`
    const updated = stories.update(story.id, { status:'completed', generatedMediaUrl: url })
    res.json(updated)
  }, 2000)
})

module.exports = router
