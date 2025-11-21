const express = require("express");
const router = express.Router();
const hrActivityController = require("../controllers/HrActivity.controller");

router.post("/startWork", hrActivityController.startWork);
router.post("/stopWork", hrActivityController.stopWork);
router.post("/startBreak", hrActivityController.startBreak);
router.post("/stopBreak", hrActivityController.stopBreak);
router.get("/attendance", hrActivityController.getHrAttendanceByDateRange);

module.exports = router;
