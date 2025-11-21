const express = require("express");
const router = express.Router();
const executiveActivityController = require("../controllers/ExecutiveActivity.controller");

router.post("/startWork", executiveActivityController.startWork);
router.post("/stopWork", executiveActivityController.stopWork);
router.post("/startBreak", executiveActivityController.startBreak);
router.post("/stopBreak", executiveActivityController.stopBreak);
router.post("/updateCallTime", executiveActivityController.updateCallTime);
router.post("/trackLeadVisit", executiveActivityController.trackLeadVisit);
router.get("/adminDashboard", executiveActivityController.getAdminDashboard);
//get attendace + leaves
router.get(
  "/getAttendance",
  executiveActivityController.getAttendanceByDateRangeIncludingLeave
);
//old api to get attendance only
router.get("/attendance", executiveActivityController.getAttendanceByDateRange);
router.get(
  "/daily-activity",
  executiveActivityController.getAllExecutiveActivitiesByDate
);
router.get(
  "/:executiveId",
  executiveActivityController.getExecutiveActivityByExecutiveId
);
// ✅ New route for summary by date range
router.get(
  "/summary/:executiveId",
  executiveActivityController.getExecutiveSummaryByRange
);

module.exports = router;
