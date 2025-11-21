const { Sequelize } = require("sequelize");

module.exports = function initializeModels(sequelize) {
  const db = {};
  db.Sequelize = Sequelize;
  db.sequelize = sequelize;

  // Load models – no third argument, models handle their own table names
  db.Users = require("../models/User.model")(sequelize, Sequelize);
  db.Lead = require("../models/Lead.model")(sequelize, Sequelize);
  db.Meeting = require("../models/Meeting.model")(sequelize, Sequelize);
  db.Opportunity = require("../models/Opportunity.model")(sequelize, Sequelize);
  db.ClientLead = require("../models/ClientLead.model")(sequelize, Sequelize);
  db.Invoice = require("../models/Invoice.model")(sequelize, Sequelize);
  db.ExecutiveActivity = require("../models/ExecutiveActivity.model")(
    sequelize,
    Sequelize
  );
  db.FollowUp = require("../models/Followup.model")(sequelize, Sequelize);
  db.FollowUpHistory = require("../models/FollowUpHistory.model")(
    sequelize,
    Sequelize
  );
  db.FreshLead = require("../models/FreshLead.model")(sequelize, Sequelize);
  db.ConvertedClient = require("../models/ConvertedClient.model")(
    sequelize,
    Sequelize
  );
  db.CloseLead = require("../models/CloseLead.model")(sequelize, Sequelize);
  db.Notification = require("../models/Notification.model")(
    sequelize,
    Sequelize
  );
  db.Customer = require("../models/Customer.model")(sequelize, Sequelize);
  db.CustomerDetails = require("../models/CustomerDetails.model")(
    sequelize,
    Sequelize
  );
  db.ProcessPerson = require("../models/ProcessPerson.model")(
    sequelize,
    Sequelize
  );
  db.CustomerStages = require("../models/CustomerStages.model")(
    sequelize,
    Sequelize
  );
  db.RevenueChart = require("../models/RevenueChart.model")(
    sequelize,
    Sequelize
  );
  db.Team = require("../models/Team.model")(sequelize, Sequelize);
  db.Manager = require("../models/Manager.model")(sequelize, Sequelize);
  db.Hr = require("../models/Hr.model")(sequelize, Sequelize);

  db.RolePermission = require("../models/RolePermission.model")(
    sequelize,
    Sequelize
  );
  db.CustomerDocument = require("../models/CustomerDocument.model")(
    sequelize,
    Sequelize
  );
  db.ChatHistory = require("../models/ChatHistory.model")(sequelize, Sequelize);
  db.EmailTemplate = require("../models/EmailTemplate.model")(
    sequelize,
    Sequelize
  );
  db.CallDetails = require("../models/CallDetails.model")(sequelize, Sequelize);
  db.ProcessFollowUpHistory = require("../models/ProcessFollowupHIstory.model")(
    sequelize,
    Sequelize
  );
  db.ProcessedFinal = require("../models/ProcessedFinal.model")(
    sequelize,
    Sequelize
  );
  db.ProcessPersonActivity = require("../models/ProcessPersonActivity.model")(
    sequelize,
    Sequelize
  );
  db.HrActivity = require("../models/HrActivities.model")(sequelize, Sequelize);
  db.ManagerActivity = require("../models/ManagerActivities.model")(
    sequelize,
    Sequelize
  );

  db.LeaveApplication = require("../models/LeaveApplication.model")(
    sequelize,
    Sequelize
  );
  db.FollowupNotification = require("../models/FollowupNotification.model")(
    sequelize,
    Sequelize
  );

  db.UnverifiedUser = require("../models/UnverifiedUsers.model")(
    sequelize,
    Sequelize
  );
  db.Payroll = require("../models/Payroll.model")(sequelize, Sequelize);

  // ------------------------
  // Define Associations
  // ------------------------

  db.Users.hasMany(db.ExecutiveActivity, {
    foreignKey: "ExecutiveId",
    onDelete: "CASCADE",
  });
  db.ExecutiveActivity.belongsTo(db.Users, { foreignKey: "ExecutiveId" });

  db.ClientLead.hasMany(db.Lead, {
    foreignKey: "clientLeadId",
    onDelete: "CASCADE",
  });
  db.Lead.belongsTo(db.ClientLead, {
    foreignKey: "clientLeadId",
    as: "clientLead",
  });

  db.Lead.hasOne(db.FreshLead, { foreignKey: "leadId", onDelete: "CASCADE" });
  db.FreshLead.belongsTo(db.Lead, { foreignKey: "leadId", as: "lead" });

  db.Lead.hasMany(db.FollowUp, { foreignKey: "leadId", onDelete: "CASCADE" });
  db.FollowUp.belongsTo(db.Lead, { foreignKey: "leadId", as: "lead" });

  db.Lead.hasOne(db.ConvertedClient, {
    foreignKey: "leadId",
    onDelete: "CASCADE",
  });
  db.ConvertedClient.belongsTo(db.Lead, { foreignKey: "leadId", as: "lead" });

  db.FreshLead.hasMany(db.FollowUp, {
    foreignKey: "fresh_lead_id",
    onDelete: "CASCADE",
    as: "followUps",
  });
  db.FollowUp.belongsTo(db.FreshLead, {
    foreignKey: "fresh_lead_id",
    as: "freshLead",
  });

  db.FreshLead.hasMany(db.FollowUpHistory, {
    foreignKey: "fresh_lead_id",
    onDelete: "CASCADE",
    as: "followUpHistories",
  });
  db.FollowUpHistory.belongsTo(db.FreshLead, {
    foreignKey: "fresh_lead_id",
    as: "freshLead",
  });

  db.FollowUp.hasMany(db.FollowUpHistory, {
    foreignKey: "follow_up_id",
    onDelete: "CASCADE",
    as: "followUpHistories",
  });
  db.FollowUpHistory.belongsTo(db.FollowUp, {
    foreignKey: "follow_up_id",
    as: "followUp",
  });

  db.FreshLead.hasOne(db.ConvertedClient, {
    foreignKey: "fresh_lead_id",
    onDelete: "CASCADE",
    as: "convertedClient",
  });
  db.ConvertedClient.belongsTo(db.FreshLead, {
    foreignKey: "fresh_lead_id",
    as: "freshLead",
  });

  db.FreshLead.hasOne(db.CloseLead, {
    foreignKey: "freshLeadId",
    onDelete: "CASCADE",
    as: "closeLead",
  });
  db.CloseLead.belongsTo(db.FreshLead, {
    foreignKey: "freshLeadId",
    as: "freshLead",
  });

  db.Users.hasMany(db.Notification, {
    foreignKey: "userId",
    onDelete: "CASCADE",
  });
  db.Notification.belongsTo(db.Users, { foreignKey: "userId" });

  db.Meeting.belongsTo(db.FreshLead, {
    foreignKey: "fresh_lead_id",
    as: "freshLead",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });
  db.Meeting.belongsTo(db.Users, {
    foreignKey: "executiveId",
    as: "executive",
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });
  db.Users.hasMany(db.Meeting, {
    foreignKey: "executiveId",
    onDelete: "SET NULL",
  });
  db.Meeting.belongsTo(db.ProcessPerson, {
    foreignKey: "processPersonId",
    as: "processPerson",
    onDelete: "SET NULL",
  });
  db.ProcessPerson.hasMany(db.Meeting, {
    foreignKey: "processPersonId",
    as: "processMeetings",
  });

  db.Customer.hasOne(db.CustomerDetails, {
    foreignKey: "customerId",
    onDelete: "CASCADE",
  });
  db.CustomerDetails.belongsTo(db.Customer, {
    foreignKey: "customerId",
  });

  db.Customer.hasOne(db.CustomerStages, {
    foreignKey: "customerId",
    onDelete: "CASCADE",
  });
  db.CustomerStages.belongsTo(db.Customer, {
    foreignKey: "customerId",
  });

  db.Team.hasMany(db.Users, {
    foreignKey: "team_id",
    onDelete: "SET NULL",
    as: "executives",
  });
  db.Users.belongsTo(db.Team, {
    foreignKey: "team_id",
    as: "team",
  });

  db.Manager.hasMany(db.Team, {
    foreignKey: "manager_id",
    onDelete: "SET NULL",
    as: "teams",
  });
  db.Team.belongsTo(db.Manager, {
    foreignKey: "manager_id",
    as: "manager",
  });

  db.Manager.hasMany(db.RolePermission, {
    foreignKey: "manager_id",
    onDelete: "CASCADE",
  });
  db.RolePermission.belongsTo(db.Manager, {
    foreignKey: "manager_id",
  });

  db.Users.hasMany(db.RolePermission, {
    foreignKey: "user_id",
    onDelete: "CASCADE",
  });
  db.RolePermission.belongsTo(db.Users, {
    foreignKey: "user_id",
  });

  db.Hr.hasMany(db.RolePermission, {
    foreignKey: "hr_id",
    onDelete: "CASCADE",
  });
  db.RolePermission.belongsTo(db.Hr, {
    foreignKey: "hr_id",
  });
  db.Customer.hasMany(db.CustomerDocument, {
    foreignKey: "customerId",
    onDelete: "CASCADE",
    as: "documents", // optional alias
  });
  db.CustomerDocument.belongsTo(db.Customer, {
    foreignKey: "customerId",
    as: "customer", // optional alias
  });
  // Assuming you have imported all models and assigned them to db

  // Customer belongs to FreshLead
  db.Customer.belongsTo(db.FreshLead, {
    foreignKey: "fresh_lead_id",
    as: "freshLead",
  });

  // FreshLead has one Customer
  db.FreshLead.hasOne(db.Customer, {
    foreignKey: "fresh_lead_id",
    as: "customer",
  });

  db.Users.hasMany(db.EmailTemplate, {
    foreignKey: "createdBy",
    as: "emailTemplates",
    onDelete: "CASCADE",
  });
  db.EmailTemplate.belongsTo(db.Users, {
    foreignKey: "createdBy",
    as: "creator",
  });
  // One User (executive) can have many CallDetails
  db.Users.hasMany(db.CallDetails, {
    foreignKey: "executiveId",
    onDelete: "SET NULL",
    as: "calls",
  });
  db.CallDetails.belongsTo(db.Users, {
    foreignKey: "executiveId",
    as: "executive",
  });
  // One FreshLead can have many process follow-up histories
  db.FreshLead.hasMany(db.ProcessFollowUpHistory, {
    foreignKey: "fresh_lead_id",
    as: "processFollowUps",
    onDelete: "CASCADE",
  });
  db.ProcessFollowUpHistory.belongsTo(db.FreshLead, {
    foreignKey: "fresh_lead_id",
    as: "freshLead",
  });

  // One ProcessPerson can have many follow-up histories
  db.ProcessPerson.hasMany(db.ProcessFollowUpHistory, {
    foreignKey: "process_person_id",
    as: "followUps",
    onDelete: "CASCADE",
  });
  db.ProcessFollowUpHistory.belongsTo(db.ProcessPerson, {
    foreignKey: "process_person_id",
    as: "processPerson",
  });

  // One FreshLead can have one ProcessedFinal record
  db.FreshLead.hasOne(db.ProcessedFinal, {
    foreignKey: "freshLeadId",
    onDelete: "CASCADE",
    as: "processedFinal",
  });
  db.ProcessedFinal.belongsTo(db.FreshLead, {
    foreignKey: "freshLeadId",
    as: "freshLead",
  });

  // One ProcessPerson can have many closed leads
  db.ProcessPerson.hasMany(db.ProcessedFinal, {
    foreignKey: "process_person_id",
    as: "closedLeads",
    onDelete: "CASCADE",
  });

  // Each closed lead belongs to one ProcessPerson
  db.ProcessedFinal.belongsTo(db.ProcessPerson, {
    foreignKey: "process_person_id",
    as: "processPerson",
  });

  // One ProcessPerson has many activities
  db.ProcessPerson.hasMany(db.ProcessPersonActivity, {
    foreignKey: "process_person_id",
    as: "activities",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Each activity belongs to one ProcessPerson
  db.ProcessPersonActivity.belongsTo(db.ProcessPerson, {
    foreignKey: "process_person_id",
    as: "processPerson",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // One HR can have many activities
  db.Hr.hasMany(db.HrActivity, {
    foreignKey: "hr_id",
    as: "activities",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Each activity belongs to one HR
  db.HrActivity.belongsTo(db.Hr, {
    foreignKey: "hr_id",
    as: "hr",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  // One Manager has many ManagerActivities
  db.Manager.hasMany(db.ManagerActivity, {
    foreignKey: "manager_id",
    as: "activities",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Each ManagerActivity belongs to one Manager
  db.ManagerActivity.belongsTo(db.Manager, {
    foreignKey: "manager_id",
    as: "manager",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  db.Customer.hasMany(db.ProcessFollowUpHistory, {
    foreignKey: "fresh_lead_id",
    sourceKey: "fresh_lead_id",
    as: "processfollowuphistories",
  });

  db.ProcessFollowUpHistory.belongsTo(db.Customer, {
    foreignKey: "fresh_lead_id",
    targetKey: "fresh_lead_id",
    as: "customer",
  });
  // One User (executive) can have many LeaveApplications
  db.Users.hasMany(db.LeaveApplication, {
    foreignKey: "employeeId",
    as: "leaveApplications",
    onDelete: "CASCADE",
  });
  db.LeaveApplication.belongsTo(db.Users, {
    foreignKey: "employeeId",
    as: "employee",
    onDelete: "CASCADE",
  });
  db.Notification.belongsTo(db.Customer, {
    foreignKey: "customerId",
    as: "customer",
  });

  db.Customer.hasMany(db.Notification, {
    foreignKey: "customerId",
    as: "notifications",
  });

  db.Hr.hasMany(db.Notification, {
    foreignKey: "hr_id",
    as: "notifications",
  });
  db.Notification.belongsTo(db.Hr, {
    foreignKey: "hr_id",
    as: "hr",
  });

  db.Customer.belongsTo(db.FreshLead, {
    foreignKey: "fresh_lead_id",
    as: "customerFreshLead",
  });

  db.FreshLead.hasOne(db.Customer, {
    foreignKey: "fresh_lead_id",
    as: "CustomerStatus",
  });

  db.ProcessPerson.hasMany(db.Customer, {
    foreignKey: "process_person_id",
    as: "assignedCustomers", // ✅ UNIQUE alias
    onDelete: "SET NULL",
  });

  db.Customer.belongsTo(db.ProcessPerson, {
    foreignKey: "process_person_id",
    as: "assignedProcessPerson", // ✅ UNIQUE alias
  });
  // One executive (User) can have many Payroll records
  db.Users.hasMany(db.Payroll, {
    foreignKey: "executive_id",
    as: "payrolls", // ✅ Unique alias to avoid collisions
    onDelete: "CASCADE",
  });

  // Each Payroll record belongs to one executive (User)
  db.Payroll.belongsTo(db.Users, {
    foreignKey: "executive_id",
    as: "executive", // ✅ Unique alias for clarity
  });

  // ------------------------
  // Sync Models
  // ------------------------
  sequelize
    .sync({ alter: false }) // only once for full rebuild
    .then(() => console.log("✅ Tenant DB tables synced"))
    .catch((err) => console.error("❌ Error syncing tenant DB:", err));

  return db;
};
