const express = require("express");
const router = express.Router();
const {
  getOrganizationHierarchy,
} = require("../controllers/Organisation.controller");

// Route to get the organization hierarchy
router.get("/graph", getOrganizationHierarchy);

module.exports = router;
