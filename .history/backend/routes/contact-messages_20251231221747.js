const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');

// POST /api/contact-messages
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required' });
    }

    const contactMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
      status: 'new'
    });

    res.status(201).json({ data: contactMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
