const express = require("express");
const router = express.Router();
const followUpHistoryController = require("../controllers/FollowUpHistory.controller");
const auth = require("../middleware/auth");

// Create follow-up history
router.post("/create", followUpHistoryController.createFollowUpHistory);

// Update follow-up history

// Get all follow-up histories
router.get(
  "/",
  auth(),
  followUpHistoryController.getFollowUpHistoriesByExecutive
);

//get all the follow-up history of particular lead by fresh lead id
router.get(
  "/:fresh_lead_id",
  auth(),
  followUpHistoryController.getFollowUpHistoriesByFreshLeadId
);
module.exports = router;
