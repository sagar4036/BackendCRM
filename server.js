// ================== 🌍 ENV & CRON SETUP ==================
require("dotenv").config();
require("./cron/notificationCleaner");
require("./cron/blacklistExpired");

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const cron = require("node-cron");

const corsOptions = require("./utils/corsOption");
const { getTenantDB } = require("./config/sequelizeManager");
const { initializeNotificationHelper } = require("./utils/notificationHelper");
const notifyUpcomingMeetings = require("./cron/meetingNotifier");
const notifyScheduledFollowups = require("./cron/followupNotifier");
const { syncDatabase } = require("./utils/syncDatabase");

const auth = require("./middleware/auth");
const tenantResolver = require("./middleware/tenantResolver");

// ================== 🚀 APP & SERVER INIT ==================
const app = express();
const server = http.createServer(app);

// ================== ⚙️ GLOBAL MIDDLEWARES ==================

// ✅ Allow all CORS headers and handle preflight manually
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ✅ Body & cookie parser
app.use(express.json());
app.use(cookieParser());

// ✅ Debug request logger
app.use((req, res, next) => {
  console.log("📥 [REQUEST]", {
    method: req.method,
    url: req.originalUrl,
    origin: req.headers.origin,
  });
  next();
});

// ✅ Simple health check
app.get("/api/ping", (req, res) => {
  res.send("✅ Backend reachable! CORS working fine.");
});

// ================== 🔌 SOCKET.IO SETUP ==================
const io = new Server(server, {
  cors: {
    origin: [
      "https://crm-frontend-delta-ebon.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// Attach socket instance to each request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ================== 📁 ROUTE MOUNTING ==================

// ---- Master & Company Routes ----
app.use("/api/masteruser", require("./routes/MasterUser.routes"));
app.use("/api/company", require("./routes/Company.routes"));

// ---- Authenticated Tenant Routes ----
const protectedRoutes = [
  ["crew", require("./routes/Agents.routes")],
  ["leads", require("./routes/Lead.routes")],
  ["calldetails", require("./routes/CallDetails.routes")],
  ["meetings", require("./routes/Meeting.routes")],
  ["opportunities", require("./routes/Opportunity.routes")],
  ["client-leads", require("./routes/ClientLead.routes")],
  ["invoice", require("./routes/Invoices.routes")],
  ["notification", require("./routes/Notification.routes")],
  ["executive-dashboard", require("./routes/Executivedashboard.routes")],
  ["settings", require("./routes/Settings.routes")],
  ["followup", require("./routes/Followup.routes")],
  ["followuphistory", require("./routes/FollowUpHistory.routes")],
  ["customer-details", require("./routes/CustomerDetails.routes")],
  ["customer-stages", require("./routes/CustomerStages.routes")],
  ["template", require("./routes/EmailTemplate.routes")],
  ["process-history", require("./routes/ProcessFollowupHistory.routes")],
  ["role-permissions", require("./routes/RolePermission.routes")],
  ["processed", require("./routes/ProcessedFinal.routes")],
  [
    "process-person-activities",
    require("./routes/ProcessPersonActivity.routes"),
  ],
  ["manager-activities", require("./routes/ManagerActivity.routes")],
  ["hr-activities", require("./routes/HrActivity.routes")],
  ["leave", require("./routes/LeaveApplication.routes")],
  ["organization", require("./routes/Organisation.routes")],
  ["schedule", require("./routes/FollowupNotification.routes")],
  ["payroll", require("./routes/Payroll.routes")],
  ["executive-activities", require("./routes/ExecutiveActivity.routes")],
  ["freshleads", require("./routes/FreshLead.routes")],
  ["converted", require("./routes/ConvertedClient.routes")],
  ["close-leads", require("./routes/CloseLead.routes")],
];

// ✅ Enable OPTIONS for each protected route
protectedRoutes.forEach(([path, route]) => {
  app.options(`/api/${path}`, cors(corsOptions));
  app.use(
    `/api/${path}`,
    (req, res, next) => {
      if (req.method === "OPTIONS") return res.sendStatus(200);
      next();
    },
    auth(),
    tenantResolver,
    route
  );
});

// ---- Non-auth Tenant Routes ----
const publicTenantRoutes = [
  ["", require("./routes/User.routes")],
  ["manager", require("./routes/Manager.routes")],
  ["hr", require("./routes/Hr.routes")],
  ["processperson", require("./routes/ProcessPerson.routes")],
  ["customer", require("./routes/Customer.routes")],
  ["revenue", require("./routes/RevenueChart.routes")],
  ["eod-report", require("./routes/EodReport.routes")],
  ["", require("./routes/Chatbot.routes")],
  ["", require("./routes/Calendar.routes")],
  ["", require("./routes/UserStatus.routes")],
  ["", require("./routes/leadCheck.routes")],
  ["", require("./routes/Eod.routes")],
  ["customer", require("./routes/CustomerDocuments.routes")],
];

publicTenantRoutes.forEach(([path, route]) => {
  app.options(`/api/${path}`, cors(corsOptions));
  app.use(`/api/${path}`, tenantResolver, route);
});

// ================== ⚡ SOCKET EVENTS ==================
const connectedUsers = {};
global.connectedUsers = connectedUsers;

initializeNotificationHelper(io, connectedUsers);

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("set_user", async ({ userId, companyId }) => {
    try {
      if (!userId || !companyId) {
        console.warn("⚠️ Missing userId or companyId in socket connection");
        return;
      }

      socket.userId = userId;
      socket.companyId = companyId;
      connectedUsers[userId] = socket.id;

      const tenantDB = await getTenantDB(companyId);
      await tenantDB.Users.update(
        { is_online: true },
        { where: { id: userId } }
      );

      io.emit("status_update", { userId, is_online: true });
    } catch (err) {
      console.error("⚠️ Error setting user online:", err);
    }
  });

  socket.on("disconnect", async () => {
    const { userId, companyId } = socket;
    if (userId && companyId) {
      delete connectedUsers[userId];
      try {
        const tenantDB = await getTenantDB(companyId);
        await tenantDB.Users.update(
          { is_online: false },
          { where: { id: userId } }
        );

        io.emit("status_update", { userId, is_online: false });
        console.log("🔴 User disconnected:", userId);
      } catch (err) {
        console.error("⚠️ Error setting user offline:", err);
      }
    }
  });
});

// ================== ⏰ CRON JOBS ==================
cron.schedule("* * * * *", async () => {
  console.log("⏰ Running scheduled notifications...");
  await notifyUpcomingMeetings();
  await notifyScheduledFollowups();
});

// ================== 🧠 START SERVER ==================
const PORT = process.env.PORT || 5000;

(async () => {
  // ✅ Auto-sync tenant databases on deployment
  await syncDatabase();

  if (process.env.NODE_ENV !== "test") {
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  }
})();

module.exports = { app };
