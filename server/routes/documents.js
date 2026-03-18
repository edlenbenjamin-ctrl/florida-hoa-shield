const express = require('express');
const Document = require('../models/Document');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/documents
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'homeowner' ? { isPublic: true } : {};
    const { category } = req.query;
    if (category) filter.category = category;
    const documents = await Document.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/documents
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const document = await Document.create({ ...req.body, uploadedBy: req.user.id });
    res.status(201).json(document);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/documents/:id
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const document = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('uploadedBy', 'name');
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json(document);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
