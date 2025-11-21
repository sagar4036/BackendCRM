const express = require("express");
const router = express.Router();
const {
  sendEmail,
  createTemplate,
  getAllTemplates,
  getTemplateById,
} = require("../controllers/EmailTemplate.controller");

router.post("/send-email", sendEmail);
router.post("/", createTemplate);
router.get("/", getAllTemplates);
router.get("/:id", getTemplateById);

module.exports = router;
