// utils/syncDatabase.js
const { getTenantDB } = require("../config/sequelizeManager");
const { sequelize: masterDB } = require("../config/masterDB");

async function syncDatabase() {
  try {
    console.log("🔄 Starting tenant database synchronization...");

    // ✅ Fetch all companies from master database
    const [companies] = await masterDB.query("SELECT id, name FROM Companies");

    if (!companies.length) {
      console.log("⚠️ No tenant companies found in master DB.");
      return;
    }

    // ✅ Loop through each company and sync its DB
    for (const company of companies) {
      try {
        console.log(`🏢 Syncing tenant database for: ${company.name}`);
        const tenantDB = await getTenantDB(company.id);

        // ✅ Auto-create missing tables/fields for tenant DB only
        await tenantDB.sequelize.sync({ alter: true });

        console.log(`✅ Tenant DB synchronized successfully: ${company.name}`);
      } catch (tenantError) {
        console.error(
          `❌ Failed to sync tenant DB for ${company.name}:`,
          tenantError.message
        );
      }
    }

    console.log("🎉 All tenant databases synchronized successfully.");
  } catch (err) {
    console.error("❌ Error during tenant DB synchronization:", err.message);
  }
}

module.exports = { syncDatabase };
