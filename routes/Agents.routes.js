// routes/Agents.routes.js
const express = require("express");
const router = express.Router();
const askExecutiveAgent = require("../agents/executiveAgent");
const askCustomerAgent = require("../agents/customerAgent");

// Executive route with web search
router.post("/crew/executive", async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user.id; // from auth middleware
    const db = req.db;

    if (!question || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const answer = await askExecutiveAgent(question, userId, db);
    res.json({ answer });
  } catch (error) {
    console.error("Executive Agent Error:", error);
    res.status(500).json({ error: "Agent failed" });
  }
});

// Customer route without web search
router.post("/crew/customer", async (req, res) => {
  try {
    const { question } = req.body;
    const customerId = req.customer?.id || req.user?.id; // flexible support for customer model
    const db = req.db;

    if (!question || !customerId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const answer = await askCustomerAgent(question, customerId, db);
    res.json({ answer });
  } catch (error) {
    console.error("Customer Agent Error:", error);
    res.status(500).json({ error: "Agent failed" });
  }
});

module.exports = router;
