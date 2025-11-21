const express = require('express');
const router = express.Router();
const { scheduleEodReport } = require('../controllers/Eod.controller'); // 👈 Make sure this matches

router.post('/report', scheduleEodReport); // 👈 POST callback should not be undefined

module.exports = router;