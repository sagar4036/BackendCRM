// routes/User.routes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/User.controller");
const auth = require("../middleware/auth");

// Public routes
router.post("/signup", userController.signupLocal);
router.post("/login", userController.login);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);
router.post("/logout", auth(), userController.logout);

// Role-specific protected routes
router.get("/admin", auth(["Admin"]), userController.getAdminDashboard);
router.get("/tl", auth(["TL"]), userController.getTLDashboard);
router.post(
  "/admin/toggle-login",
  auth(),
  userController.toggleUserLoginAccess
);
router.get(
  "/executive",
  auth(["Executive"]),
  userController.getExecutiveDashboard
);

// General profile route
router.get("/profile", auth(), userController.getUserProfile); // No role restriction

// admin settings
router.get("/admin/profile", auth(["Admin"]), userController.getAdminById); // ✅ Fetch admin profile

router.put(
  "/admin/profile",
  auth(["Admin"]),
  userController.updateAdminProfile
); // ✅ Update admin profile

router.put("/user/profile/:id", auth(), userController.updateUserProfile); //can update profiles of executives as well as tl

router.post("/admin/change_pass", auth(), userController.changePassword); // ✅ Change admin password

// New protected routes with proper authorization
router.get("/executives", auth(), userController.getAllExecutives);
router.get(
  "/team-leads",
  auth(), // Only Admin can access
  userController.getAllTeamLeads
);
router.get(
  "/executives/:id", //For executive info popover
  auth(),
  userController.getExecutiveById
);

router.get("/tls/:id", auth(), userController.getTLById);

// Get online users (accessible to Admin and TL)
router.get(
  "/online",
  auth(["Admin", "TL", "Manager"]),
  userController.getOnlineExecutives
);

//create executive and send otp to verify email
router.post(
  "/create-executive",
  auth(["Admin"]),
  userController.createExecutiveWithOtp
);

//verify the otp
router.post("/verify-otp", auth(["Admin"]), userController.verifyExecutiveOTP);

//resedn otp
router.post("/resend-otp", userController.resendExecutiveOtp);

router.post("/create-admin", auth(["Admin"]), userController.createAdmin);
router.post("/create-exec", auth(["Admin"]), userController.createExecutive);
router.post("/create-tl", auth(["Admin"]), userController.createTeamLead);

module.exports = router;
