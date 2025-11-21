// cron/blacklistExpired.js
const cron = require("node-cron");
const { Op } = require("sequelize");
const { masterDB } = require("../config/masterDB");
const Company = masterDB.models.Company;

// Schedule: every day at midnight server time
cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();
    // Update all active companies whose expiryDate is before now
    const [count] = await Company.update(
      { status: "blacklisted" },
      {
        where: {
          status: "active",
          expiryDate: { [Op.lt]: now },
        },
      }
    );
    console.log(`Auto-blacklisted ${count} companies at ${now.toISOString()}`);
  } catch (err) {
    console.error("Error during auto-blacklisting:", err);
  }
});
