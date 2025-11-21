const express = require("express");
const router = express.Router();
const {
  saveCallDetails,
  getWeeklyCallDurations,
  getCallTimeByDateRange,
  getCallDurationsGroupedByDay,
} = require("../controllers/CallDetails.controller");

const auth = require("../middleware/auth");
const multer = require("multer");
const upload = multer(); // For FormData without files

// ✅ Save call metadata (POST)
router.post("/", auth(), upload.none(), saveCallDetails);

// ✅ Fetch weekly call durations (GET)
router.get("/call-duration-weekly/:executiveId", auth(), getWeeklyCallDurations);

// ✅ Fetch Call Data by time range
router.get("/call-time/:executiveId", auth(), getCallTimeByDateRange);

router.get("/call-durations-grouped/:executiveId", auth(), getCallDurationsGroupedByDay);



module.exports = router;
