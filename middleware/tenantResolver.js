const { getTenantDB } = require("../config/sequelizeManager");
const { masterDB } = require("../config/masterDB");

const skipTenantPaths = ["/api/masteruser/login", "/api/masteruser/signup"];

function addCorsHeaders(req, res) {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-company-id"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
}

function extractCompanyId(req) {
  const sources = [
    req.body?.companyId,
    req.query?.companyId,
    req.headers["x-company-id"],
  ];
  for (let id of sources) {
    if (typeof id === "string") {
      return id.trim().replace(/[^a-z0-9\-]/gi, "");
    }
  }
  return null;
}

module.exports = async (req, res, next) => {
  addCorsHeaders(req, res); // ✅ always attach CORS headers

  // ⏭️ Skip middleware for master-level endpoints
  if (skipTenantPaths.some((path) => req.originalUrl.startsWith(path))) {
    return next();
  }

  const companyId = extractCompanyId(req);
  if (!companyId) {
    console.warn("⚠️ [TENANT] Missing or invalid companyId");
    return res.status(400).json({ message: "Missing or invalid companyId" });
  }

  try {
    const Company = masterDB.models.Company;
    const company = await Company.findByPk(companyId);

    if (!company)
      return res
        .status(404)
        .json({ message: "Invalid companyId or company not found" });

    const now = new Date();

    if (company.expiryDate && new Date(company.expiryDate) <= now)
      return res
        .status(403)
        .json({ message: "Subscription expired – please renew." });

    if (company.setDate && now < new Date(company.setDate))
      return res.status(403).json({
        message: `Access not allowed until ${new Date(
          company.setDate
        ).toDateString()}.`,
      });

    if (company.status === "paused")
      return res.status(403).json({ message: "Access is temporarily paused." });

    if (company.status === "blacklisted")
      return res
        .status(403)
        .json({ message: "Company is blacklisted – please contact support." });

    const tenantDB = await getTenantDB(companyId);
    if (!tenantDB)
      return res
        .status(500)
        .json({ message: "Error resolving tenant database" });

    req.db = tenantDB;
    req.companyId = companyId;

    next();
  } catch (err) {
    console.error("❌ [TENANT] Error in tenantResolver:", err);
    res
      .status(500)
      .json({ message: "Internal error resolving tenant", error: err.message });
  }
};
