const express = require("express");
const router = express.Router();
const {
  createCustomerStages,
  getCustomerStages,
  updateCustomerStages,
  getCustomerStagesById,
  addStageComment,
  getStageComments,
  addStageCommentAndNotify,
} = require("../controllers/CustomerStages.controller");

router.post("/stages", createCustomerStages);
router.get("/stages", getCustomerStages);
router.put("/stages", updateCustomerStages);
router.get("/:customerId", getCustomerStagesById);

//To add stage comment and send the notification to customer
router.post("/stage-comment/notify", addStageCommentAndNotify);

//To add multiple comments on a single stage
router.post("/stage-comment/add", addStageComment);

//To Fetch all the comments on a single stage
router.get("/stage-comment/get", getStageComments);

module.exports = router;
