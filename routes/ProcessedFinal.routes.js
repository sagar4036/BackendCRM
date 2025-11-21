const express = require("express");
const router = express.Router();
const processedFinalController = require("../controllers/ProcessedFinal.controller");

router.post("/create", processedFinalController.createFinalizedLead);
router.get("/", processedFinalController.getFinalizedLead);

module.exports = router;
