const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  signupManager,
  loginManager,
  logoutManager,
  createTeam,
  getManagerTeams,
  addExecutiveToTeam,
  getManagerProfile,
  getAllManagers,
  toggleManagerLoginAccess,
  getAllTeamMember,
  getManagerById,
  updateManagerProfile,
  getManagerLoginStatus,
  changeManagerPassword,
  getAllTeams,
  deleteTeam,
} = require("../controllers/Manager.controller");

router.post("/signup", signupManager);
router.post("/login", loginManager);
router.post("/logout", auth(), logoutManager);
//change manager password
router.post("/change-password", auth(), changeManagerPassword);
router.post("/teams", auth(), createTeam);
router.delete("/:id", auth(), deleteTeam);
//get all the teams
router.get("/all-teams", auth(), getAllTeams);
router.post("/get-teams", auth(), getManagerTeams);
router.post("/addExecutive", auth(), addExecutiveToTeam);
router.get("/profile", auth(), getManagerProfile);
//toggle if manager can login or not
router.post("/toggle-login", auth(), toggleManagerLoginAccess);
//get managers login status
router.get("login-status/:id", auth(), getManagerLoginStatus);
//get all team members of a team
router.post("/get-team", auth(), getAllTeamMember);
//get manager by id
router.get("/:id", auth(), getManagerById);
//update manager profile
router.put("/:id", auth(), updateManagerProfile);

//fetch all managers
router.get("/", auth(), getAllManagers);
module.exports = router;
