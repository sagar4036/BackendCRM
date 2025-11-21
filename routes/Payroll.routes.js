const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/Payroll.controller");

//Generate payroll for Executive
router.post("/executive", payrollController.generateExecutivePayroll);
//Generate payroll for Manager
router.post("/manager", payrollController.generateManagerPayroll);
//Generate payroll for HR
router.post("/hr", payrollController.generateHrPayroll);
//Generate payroll for TL
router.post("/TL", payrollController.generateTlPayroll);
//Get all payroll
router.get("/", payrollController.getAllPayrolls);
//Get single executives payroll
router.get("/one", payrollController.getPayrollForExecutive);
//Get payroll by filtering Designation Month and id
router.get("/filter", payrollController.getPayrollByFilters);

module.exports = router;
