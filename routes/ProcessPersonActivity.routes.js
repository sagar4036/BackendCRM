const express = require("express");
const router = express.Router();
const processPersonActivityController = require("../controllers/ProcessPersonActivity.controller");

router.post("/startWork", processPersonActivityController.startWork);
router.post("/stopWork", processPersonActivityController.stopWork);
router.post("/startBreak", processPersonActivityController.startBreak);
router.post("/stopBreak", processPersonActivityController.stopBreak);
router.get(
  "/attendance",
  processPersonActivityController.getProcessPersonAttendanceByDateRange
);

module.exports = router;
