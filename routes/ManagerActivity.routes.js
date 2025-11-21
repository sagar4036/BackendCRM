const express = require("express");
const router = express.Router();
const managerActivityController = require("../controllers/ManagerActivity.controller");

router.post("/startWork", managerActivityController.startWork);
router.post("/stopWork", managerActivityController.stopWork);
router.post("/startBreak", managerActivityController.startBreak);
router.post("/stopBreak", managerActivityController.stopBreak);
router.get(
  "/attendance",
  managerActivityController.getManagerAttendanceByDateRange
);

module.exports = router;
