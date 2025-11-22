// routes/User.routes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/User.controller");
const auth = require("../middleware/auth");

// ------------------------------
// PUBLIC ROUTES
// ------------------------------
router.post("/signup", userController.signupLocal);
router.post("/login", userController.login);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);
router.post("/logout", auth(), userController.logout);

// ------------------------------
// DASHBOARD ROUTES (ROLE-BASED)
// ------------------------------
router.get("/admin", auth(["Admin"]), userController.getAdminDashboard);
router.get("/tl", auth(["TL"]), userController.getTLDashboard);
router.get("/executive", auth(["Executive"]), userController.getExecutiveDashboard);

// ------------------------------
// PROFILE ROUTES
// ------------------------------
router.get("/profile", auth(), userController.getUserProfile);
router.get("/admin/profile", auth(["Admin"]), userController.getAdminById);
router.put("/admin/profile", auth(["Admin"]), userController.updateAdminProfile);
router.put("/user/profile/:id", auth(), userController.updateUserProfile);

router.post("/admin/change_pass", auth(["Admin"]), userController.changePassword);

// ------------------------------
// MANAGEMENT ROUTES
// ------------------------------
router.get("/executives", auth(["Admin"]), userController.getAllExecutives);
router.get("/executives/:id", auth(["Admin"]), userController.getExecutiveById);

router.get("/team-leads", auth(["Admin"]), userController.getAllTeamLeads);
router.get("/tls/:id", auth(["Admin"]), userController.getTLById);

// ------------------------------
// ONLINE USERS
// ------------------------------
router.get("/online", auth(["Admin", "TL", "Manager"]), userController.getOnlineExecutives);

// ------------------------------
// EXECUTIVE CREATION (DIRECT) — NO OTP
// ------------------------------
router.post("/create-exec", auth(["Admin"]), userController.createExecutive);

// ------------------------------
// OTHER CREATION ROUTES
// ------------------------------
router.post("/create-admin", auth(["Admin"]), userController.createAdmin);
router.post("/create-tl", auth(["Admin"]), userController.createTeamLead);

// ------------------------------
// (OPTIONAL) OLD OTP ROUTES IF EVER NEEDED
// Commented intentionally
// ------------------------------
// router.post("/create-executive", auth(["Admin"]), userController.createExecutiveWithOtp);
// router.post("/verify-otp", auth(["Admin"]), userController.verifyExecutiveOTP);
// router.post("/resend-otp", userController.resendExecutiveOtp);

module.exports = router;
