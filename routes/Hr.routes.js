const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  signupHr,
  loginHr,
  logoutHr,
  getHrProfile,
  getAllHrs,
  toggleHrLoginAccess,
  getHrById,
  updateHrProfile,
  getHrLoginStatus,
  changeHrPassword,
} = require("../controllers/Hr.controller");

router.post("/signup", signupHr);
router.post("/login", loginHr);
router.post("/logout", logoutHr);
router.post("/change-password", auth(), changeHrPassword);
router.get("/profile", auth(), getHrProfile);
router.post("/toggle-login", auth(), toggleHrLoginAccess);
router.get("/", auth(), getAllHrs);
router.get("/:id", auth(), getHrById);
router.put("/:id", auth(), updateHrProfile);
router.get("/login-status/:id", auth(), getHrLoginStatus);

module.exports = router;
