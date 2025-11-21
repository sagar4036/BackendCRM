const express = require("express");
const router = express.Router();
const {
  loginCustomer,
  signupCustomer,
  logoutCustomer,
  getAllCustomers,
  markAsUnderReview,
  markAsApproved,
  markAsRejected,
  markAsMeeting,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/Customer.controller");
const auth = require("../middleware/auth");

// Login Route
router.post("/login", loginCustomer);

// Signup Route
router.post("/signup", signupCustomer);

// Logout Route
router.post("/logout", auth(), logoutCustomer);

router.get("/getAllCustomer", getAllCustomers);

router.post("/change-password", auth(), changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.put("/status/under_review/:id", auth(), markAsUnderReview);
router.put("/status/approved/:id", auth(), markAsApproved);
router.put("/status/rejected/:id", auth(), markAsRejected);
router.put("/status/meeting/:id", auth(), markAsMeeting);

module.exports = router;
