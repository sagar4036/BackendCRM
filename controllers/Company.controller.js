// controllers/companyController.js

const { masterDB } = require("../config/masterDB"); // assuming masterDB is exported
const { getTenantDB } = require("../config/sequelizeManager");
const { Op } = require("sequelize");
require("dotenv").config();

const Company = masterDB.models.Company;

/**
 * Create a new tenant company.
 */
async function createCompany(req, res) {
  const { name, db_name, db_host, db_user, db_password, db_port } = req.body;

  if (!name || !db_name || !db_host || !db_user || !db_password || !db_port) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check for existing company
    const existing = await Company.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ message: "Company already exists" });
    }

    // Create new company (status defaults to "active", expiryDate null)
    const company = await Company.create({
      name,
      db_name,
      db_host,
      db_user,
      db_password,
      db_port,
    });

    // (Optional) Immediately initialize tenant DB
    await getTenantDB(company.id);

    return res.status(201).json({
      message: "Company created",
      company: {
        id: company.id,
        name: company.name,
        db_name: company.db_name,
        db_host: company.db_host,
        db_user: company.db_user,
        db_port: company.db_port,
        status: company.status,
        expiryDate: company.expiryDate,
      },
    });
  } catch (err) {
    console.error("Error creating company:", err);
    return res.status(500).json({ message: "Failed to create company" });
  }
}

/**
 * List all companies for the master user.
 */
async function getCompaniesForMasterUser(req, res) {
  try {
    const companies = await Company.findAll({
      attributes: [
        "id",
        "name",
        "db_name",
        "db_host",
        "db_user",
        "db_port",
        "status",
        "expiryDate",
        "createdAt",
        "updatedAt",
      ],
    });

    return res.status(200).json({
      message: "Companies retrieved successfully",
      companies,
    });
  } catch (error) {
    console.error("❌ Error fetching companies for master user:", error);
    return res
      .status(500)
      .json({ message: "Server error while fetching companies" });
  }
}

/**
 * Master user sets or overrides a company’s expiration date.
 * Automatically flips status back to "active".
 */
async function setExpiryDate(req, res) {
  const { id } = req.params;
  const { expiryDate } = req.body; // ISO string expected

  if (!expiryDate) {
    return res.status(400).json({ message: "expiryDate is required" });
  }

  const date = new Date(expiryDate);
  if (isNaN(date)) {
    return res.status(400).json({ message: "Invalid expiryDate format" });
  }

  try {
    const [updated] = await Company.update(
      { expiryDate: date, status: "active" },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({ message: "Company not found" });
    }

    return res.json({
      message: "Expiry date set",
      company: { id, expiryDate: date, status: "active" },
    });
  } catch (err) {
    console.error("Error setting expiry date:", err);
    return res.status(500).json({ message: "Failed to set expiry date" });
  }
}

/**
 * Master user pauses all transactions for a company.
 * Sets status="paused".
 */
async function pauseCompany(req, res) {
  const { id } = req.params;

  try {
    const [updated] = await Company.update(
      { status: "paused" },
      { where: { id, status: "active" } }
    );

    if (!updated) {
      return res
        .status(400)
        .json({ message: "Company not found or not currently active" });
    }

    return res.json({ message: "Company paused", status: "paused" });
  } catch (err) {
    console.error("Error pausing company:", err);
    return res.status(500).json({ message: "Failed to pause company" });
  }
}

/**
 * Master user resumes a paused company.
 * Sets status="active".
 */
async function resumeCompany(req, res) {
  const { id } = req.params;

  try {
    const [updated] = await Company.update(
      { status: "active" },
      { where: { id, status: "paused" } }
    );

    if (!updated) {
      return res
        .status(400)
        .json({ message: "Company not found or not currently paused" });
    }

    return res.json({ message: "Company resumed", status: "active" });
  } catch (err) {
    console.error("Error resuming company:", err);
    return res.status(500).json({ message: "Failed to resume company" });
  }
}

module.exports = {
  createCompany,
  getCompaniesForMasterUser,
  setExpiryDate,
  pauseCompany,
  resumeCompany,
};
