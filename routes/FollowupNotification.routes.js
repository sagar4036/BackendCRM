const express = require("express");
const router = express.Router();
const controller = require("../controllers/FollowupNotification.controller");

router.post("/notification", controller.scheduleFollowUpNotification);

module.exports = router;
