const express = require("express");
const router = express.Router();
const {
  loginProcessPerson,
  signupProcessPerson,
  logoutProcessPerson,
  getAllConvertedClients,
  importConvertedClientsToCustomers,
  getProcessSettings,
  updateProcessSettings,
  getAllProcessPersons,
  toggleProcessPersonLoginAccess,
  getProcessPersonById,
  updateProcessPersonProfile,
  getProcessPersonLoginStatus,
  changeProcessPersonPassword,
  importConvertedClientsToProcessPerson,
  getProcessPersonCustomers,
} = require("../controllers/ProcessPerson.controller");
const auth = require("../middleware/auth");

// Login Route
router.post("/login", loginProcessPerson);

// Signup Route
router.post("/signup", signupProcessPerson);

router.post("/logout", auth(), logoutProcessPerson);

router.post("/change-password", auth(), changeProcessPersonPassword);

router.get("/convertedclients", auth(), getAllConvertedClients);

//assign selected converted leads to particular process person and move them to customer table
router.post(
  "/assign-process-person",
  auth(),
  importConvertedClientsToProcessPerson
);

//get customers for logged in process person
router.get("/get-customers", auth(), getProcessPersonCustomers);

router.post("/import-converted-customer", importConvertedClientsToCustomers);

router.get("/process/settings", auth(), getProcessSettings);
router.put("/process/settings", auth(), updateProcessSettings);
router.post("/toggle-login", auth(), toggleProcessPersonLoginAccess);
router.get("/login-status/:id", auth(), getProcessPersonLoginStatus);
router.get("/", auth(), getAllProcessPersons);
router.get("/:id", auth(), getProcessPersonById);
router.put("/:id", auth(), updateProcessPersonProfile);

module.exports = router;
