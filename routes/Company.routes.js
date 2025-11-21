// routes/admin.js
const express = require("express");
const router = express.Router();

const {
  createCompany,
  getCompaniesForMasterUser,
  setExpiryDate,
  pauseCompany,
  resumeCompany,
} = require("../controllers/Company.controller");
const authMaster = require("../middleware/authMaster");

// All of these routes require a valid master-user token
router.post("/create-company", authMaster(), createCompany);

router.get("/master/companies", authMaster(), getCompaniesForMasterUser);

router.post("/companies/:id/expiry", authMaster(), setExpiryDate);

router.post("/companies/:id/pause", authMaster(), pauseCompany);

router.post("/companies/:id/resume", authMaster(), resumeCompany);

module.exports = router;
