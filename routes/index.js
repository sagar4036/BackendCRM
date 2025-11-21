const express = require("express");
const router = express.Router();

// Auth middlewares
const auth = require("../middleware/auth");
const authMaster = require("../middleware/authMaster");
const tenantResolver = require("../middleware/tenantResolver");

// Public & Master routes
router.use("/masteruser", require("./MasterUser.routes"));
router.use("/company", require("./Company.routes"));
router.use("/crew", auth(), tenantResolver, require("./Agents.routes"));

// Tenant routes (with various middleware combinations)
router.use("/", tenantResolver, require("./User.routes"));
router.use("/manager", tenantResolver, require("./Manager.routes"));
router.use("/hr", tenantResolver, require("./Hr.routes"));
router.use("/leads", auth(), tenantResolver, require("./Lead.routes"));
router.use(
  "/calldetails",
  auth(),
  tenantResolver,
  require("./CallDetails.routes")
);
router.use("/meetings", auth(), tenantResolver, require("./Meeting.routes"));
router.use(
  "/opportunities",
  auth(),
  tenantResolver,
  require("./Opportunity.routes")
);
router.use(
  "/client-leads",
  auth(),
  tenantResolver,
  require("./ClientLead.routes")
);
router.use("/invoice", auth(), tenantResolver, require("./Invoices.routes"));
router.use("/", tenantResolver, require("./Chatbot.routes"));
router.use(
  "/executive-activities",
  auth(),
  tenantResolver,
  require("./ExecutiveActivity.routes")
);
router.use(
  "/freshleads",
  auth(),
  tenantResolver,
  require("./FreshLead.routes")
);
router.use(
  "/converted",
  auth(),
  tenantResolver,
  require("./ConvertedClient.routes")
);
router.use(
  "/close-leads",
  auth(),
  tenantResolver,
  require("./CloseLead.routes")
);
router.use(
  "/notification",
  auth(),
  tenantResolver,
  require("./Notification.routes")
);
router.use(
  "/executive-dashboard",
  auth(),
  tenantResolver,
  require("./Executivedashboard.routes")
);
router.use("/settings", auth(), tenantResolver, require("./Settings.routes"));
router.use("/followup", auth(), tenantResolver, require("./Followup.routes"));
router.use(
  "/followuphistory",
  auth(),
  tenantResolver,
  require("./FollowUpHistory.routes")
);
router.use("/processperson", tenantResolver, require("./ProcessPerson.routes"));
router.use("/customer", tenantResolver, require("./Customer.routes"));
router.use("/email", tenantResolver, require("./EmailTemplate.routes"));
router.use("/revenue", tenantResolver, require("./RevenueChart.routes"));
router.use(
  "/customer-details",
  auth(),
  tenantResolver,
  require("./CustomerDetails.routes")
);
router.use(
  "/customer-stages",
  auth(),
  tenantResolver,
  require("./CustomerStages.routes")
);
router.use("/eod-report", tenantResolver, require("./EodReport.routes"));
router.use("/", auth(), tenantResolver, require("./Calendar.routes"));
router.use("/", auth(), tenantResolver, require("./UserStatus.routes"));
router.use("/", tenantResolver, require("./leadCheck.routes"));
router.use("/", tenantResolver, require("./Eod.routes"));
router.use(
  "/customer",
  auth(),
  tenantResolver,
  require("./CustomerDocuments.routes")
);
router.use(
  "/template",
  auth(),
  tenantResolver,
  require("./EmailTemplate.routes")
);
router.use(
  "/process-history",
  auth(),
  tenantResolver,
  require("./ProcessFollowupHistory.routes")
);
router.use(
  "/role-permissions",
  auth(),
  tenantResolver,
  require("./RolePermission.routes")
);
router.use(
  "/processed",
  auth(),
  tenantResolver,
  require("./ProcessedFinal.routes")
);
router.use(
  "/process-person-activities",
  auth(),
  tenantResolver,
  require("./ProcessPersonActivity.routes")
);
router.use(
  "/manager-activities",
  auth(),
  tenantResolver,
  require("./ManagerActivity.routes")
);
router.use(
  "/hr-activities",
  auth(),
  tenantResolver,
  require("./HrActivity.routes")
);
router.use(
  "/leave",
  auth(),
  tenantResolver,
  require("./LeaveApplication.routes")
);
router.use(
  "/api/organization",
  auth(),
  tenantResolver,
  require("./routes/Organisation.routes")
);
module.exports = router;
