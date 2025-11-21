const express = require("express");
const router = express.Router();
const {
  upload,
  uploadFile,
  getClientLeads,
  assignExecutive,
  getLeadsByExecutive,
  getDealFunnel,
  getFollowUpClientLeads,
  getAllClientLeads,
  updateClientLead,
  deleteClientLead,
} = require("../controllers/ClientLead.controller");

router.post("/upload", upload.single("file"), uploadFile);
router.get("/getClients", getClientLeads);
router.put("/assign-executive", assignExecutive);
router.get("/executive", getLeadsByExecutive);
router.get("/dealfunnel", getDealFunnel);
router.get("/getAllClientLeads", getAllClientLeads);
router.get("/followup-leads", getFollowUpClientLeads);
router.patch("/:id", updateClientLead);
router.delete("/:id", deleteClientLead);

module.exports = router;
