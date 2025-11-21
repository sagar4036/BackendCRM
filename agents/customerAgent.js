// agents/customerAgent.js
require("dotenv").config();

async function askCustomerAgent(question, customerId, db) {
  try {
    const ChatHistory = db.ChatHistory;

    // Fetch recent history
    const history = await ChatHistory.findAll({
      where: { customerId, agentType: "customer" },
      order: [["createdAt", "ASC"]],
      limit: 10,
    });

    const historyMessages = history
      .map((msg) => `${msg.role === "user" ? "User" : "Agent"}: ${msg.message}`)
      .join("\n");

    const prompt = `You are a friendly customer-facing AI assistant at AtoZee Visas.
You do not provide legal advice or exact policy. hi i am chetanya


Conversation history:
${historyMessages}

User Question:
${question}`;

    const reply = `Thanks for your interest! ${question} — AtoZee Visas can guide you through the entire process. Please reach out to our consultants directly at +91-99999-12345 or visit https://atozeevisas.com.`;

    // Save history
    await ChatHistory.create({
      customerId,
      role: "user",
      message: question,
      agentType: "customer",
    });
    await ChatHistory.create({
      customerId,
      role: "assistant",
      message: reply,
      agentType: "customer",
    });

    return reply;
  } catch (err) {
    console.error("Customer AI Error:", err.message);
    return "Sorry, our AI assistant couldn't respond at the moment.";
  }
}

module.exports = askCustomerAgent;
