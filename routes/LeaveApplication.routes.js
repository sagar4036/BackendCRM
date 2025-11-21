const express = require("express");
const router = express.Router();

const {
  createLeaveApplication,
  getLeaveApplication,
  updateLeaveStatus,
} = require("../controllers/LeaveApplication.controller");

router.post("/apply", createLeaveApplication);
router.get("/", getLeaveApplication);
router.patch("/leave/status", updateLeaveStatus);

module.exports = router;
