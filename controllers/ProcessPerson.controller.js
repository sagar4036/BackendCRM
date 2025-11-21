const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { where } = require("sequelize");

// SIGNUP
const signupProcessPerson = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const { ProcessPerson } = req.db;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "Full Name, Email, and Password are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const existing = await ProcessPerson.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const person = await ProcessPerson.create({
      fullName,
      email,
      password: hashedPassword,
      isActive: true,
    });

    return res.status(201).json({
      message: "ProcessPerson registered successfully.",
      person: {
        id: person.id,
        fullName: person.fullName,
        email: person.email,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Signup failed." });
  }
};

// LOGIN
const loginProcessPerson = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { ProcessPerson } = req.db;

    const person = await ProcessPerson.findOne({
      where: { email, isActive: true },
    });

    if (!person) {
      return res
        .status(404)
        .json({ message: "Account not found or inactive." });
    }

    if (!person.can_login) {
      return res
        .status(403)
        .json({ message: "Login access is disabled. Please contact admin." });
    }

    const isMatch = await bcrypt.compare(password, person.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      {
        id: person.id,
        email: person.email,
        fullName: person.fullName,
        type: "processperson",
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 12 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful.",
      token,
      person: {
        id: person.id,
        fullName: person.fullName,
        email: person.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed." });
  }
};

// LOGOUT
const logoutProcessPerson = async (req, res) => {
  try {
    const { ProcessPerson } = req.db;
    const personId = req.user?.id;

    if (!personId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token missing or invalid." });
    }

    const person = await ProcessPerson.findByPk(personId);
    if (!person) {
      return res.status(404).json({ message: "ProcessPerson not found." });
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });

    return res.status(200).json({ message: "Logout successful." });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Logout failed." });
  }
};

// GET SETTINGS
const getProcessSettings = async (req, res) => {
  try {
    const { ProcessPerson } = req.db;
    const personId = req.user?.id;

    if (!personId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const person = await ProcessPerson.findByPk(personId, {
      attributes: [
        "fullName",
        "email",
        "nationality",
        "dob",
        "phone",
        "passportNumber",
        "profession",
        "location",
      ],
    });

    if (!person) {
      return res.status(404).json({ message: "ProcessPerson not found" });
    }

    return res.status(200).json({ settings: person });
  } catch (err) {
    console.error("Settings fetch error:", err);
    return res.status(500).json({ message: "Failed to fetch settings." });
  }
};

// UPDATE SETTINGS
const updateProcessSettings = async (req, res) => {
  try {
    const { ProcessPerson } = req.db;
    const personId = req.user?.id;

    if (!personId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const allowedFields = [
      "fullName",
      "phone",
      "dob",
      "nationality",
      "passportNumber",
      "profession",
      "location",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const [affectedRows] = await ProcessPerson.update(updates, {
      where: { id: personId },
    });

    if (affectedRows === 0) {
      return res.status(404).json({
        message: "No changes made or ProcessPerson not found.",
      });
    }

    return res.status(200).json({ message: "Settings updated successfully." });
  } catch (err) {
    console.error("Settings update error:", err);
    return res.status(500).json({ message: "Failed to update settings." });
  }
};

const getAllConvertedClients = async (req, res) => {
  try {
    // Debug: Log available models
    if (!req.db) {
      console.error("❌ req.db is undefined.");
      return res
        .status(500)
        .json({ message: "Database connection not available." });
    }

    console.log("📦 Models available:", Object.keys(req.db));

    const { ClientLead } = req.db;

    if (!ClientLead) {
      console.error("❌ ClientLead model not found in request DB.");
      return res.status(500).json({ message: "ClientLead model missing." });
    }

    console.log("✅ Fetching converted clients...");

    const convertedClients = await ClientLead.findAll({
      where: { status: "Converted" },
      order: [["updatedAt", "DESC"]],
    });

    if (!convertedClients.length) {
      console.warn("⚠️ No converted clients found.");
      return res.status(404).json({ message: "No converted clients found." });
    }

    console.log(`✅ Retrieved ${convertedClients.length} converted clients.`);
    return res.status(200).json({
      message: "Converted clients retrieved successfully.",
      count: convertedClients.length,
      clients: convertedClients,
    });
  } catch (error) {
    console.error("❌ Error in getAllConvertedClients:", error);
    return res.status(500).json({
      message: "Failed to fetch converted clients.",
      error: error.message,
    });
  }
};
// const importConvertedClientsToCustomers = async (req, res) => {
//   try {
//     if (!req.db) {
//       console.error("❌ req.db is undefined.");
//       return res
//         .status(500)
//         .json({ message: "Database connection not available." });
//     }

//     const { ClientLead, Customer, Lead, FreshLead } = req.db;
//     console.log("📦 Models available:", Object.keys(req.db));

//     if (!ClientLead || !Customer || !Lead || !FreshLead) {
//       console.error("❌ Required models missing: ClientLead or Customer.");
//       return res
//         .status(500)
//         .json({ message: "Required models not found in request DB." });
//     }

//     const convertedLeads = await ClientLead.findAll({
//       where: { status: "Converted" },
//     });

//     if (!convertedLeads.length) {
//       console.warn("⚠️ No converted leads found.");
//       return res.status(404).json({ message: "No converted leads to import." });
//     }

//     console.log(`🔄 Starting import for ${convertedLeads.length} leads...`);

//     let importedCount = 0;
//     let skippedCount = 0;
//     const errors = [];

//     for (const lead of convertedLeads) {
//       console.log("📌 Processing lead:", lead.id, lead.email);

//       if (!lead.email || !lead.phone) {
//         console.warn(
//           "⚠️ Skipping lead due to missing email or phone:",
//           lead.id
//         );
//         skippedCount++;
//         errors.push({
//           name: lead.name || "Unknown",
//           email: lead.email || "Missing",
//           reason: "Missing email or phone",
//         });
//         continue;
//       }

//       const existing = await Customer.findOne({
//         where: { email: lead.email },
//       });

//       if (existing) {
//         console.warn(`⚠️ Skipping ${lead.email}: already exists.`);
//         skippedCount++;
//         errors.push({
//           email: lead.email,
//           reason: "Email already exists in Customer table",
//         });
//         continue;
//       }

//       const matchingLead = await Lead.findOne({
//         where: { clientLeadId: lead.id },
//       });

//       if (!matchingLead) {
//         skippedCount++;
//         errors.push({
//           email: lead.email,
//           reason: "No Lead found for ClientLead",
//         });
//         continue;
//       }

//       const freshLead = await FreshLead.findOne({
//         where: { leadId: matchingLead.id },
//       });

//       if (!freshLead) {
//         skippedCount++;
//         errors.push({
//           email: lead.email,
//           reason: "No FreshLead found for Lead",
//         });
//         continue;
//       }

//       try {
//         const hashedPassword = await bcrypt.hash(lead.phone, 10);
//         const customerPayload = {
//           fullName: lead.name,
//           email: lead.email,
//           phone: lead.phone,
//           country: lead.country, //importing country fie
//           password: hashedPassword,
//           status: "pending",
//           fresh_lead_id: freshLead.id,
//         };

//         console.log("📝 Creating customer:", customerPayload);
//         await Customer.create(customerPayload);
//         importedCount++;
//       } catch (createErr) {
//         console.error(`❌ Failed to import ${lead.email}:`, createErr.message);
//         errors.push({
//           email: lead.email,
//           reason: createErr.message,
//         });
//       }
//     }

//     console.log("✅ Import Summary:", {
//       imported: importedCount,
//       skipped: skippedCount,
//       errorsCount: errors.length,
//     });

//     return res.status(200).json({
//       message: "Import completed.",
//       imported: importedCount,
//       skipped: skippedCount,
//       errors,
//     });
//   } catch (error) {
//     console.error("❌ Error in importConvertedClientsToCustomers:", error);
//     return res.status(500).json({
//       message: "Failed to import converted clients.",
//       error: error.message,
//     });
//   }
// };

const importConvertedClientsToCustomers = async (req, res) => {
  try {
    if (!req.db) {
      return res
        .status(500)
        .json({ message: "Database connection not available." });
    }

    const { ConvertedClient, Customer } = req.db;

    if (!ConvertedClient || !Customer) {
      return res
        .status(500)
        .json({ message: "Required models not found in request DB." });
    }

    const convertedClients = await ConvertedClient.findAll();

    if (!convertedClients.length) {
      return res
        .status(404)
        .json({ message: "No converted clients to import." });
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const client of convertedClients) {
      if (!client.email || !client.phone) {
        skippedCount++;
        errors.push({
          name: client.name || "Unknown",
          email: client.email || "Missing",
          reason: "Missing email or phone",
        });
        continue;
      }

      const existing = await Customer.findOne({
        where: { email: client.email },
      });

      if (existing) {
        skippedCount++;
        errors.push({
          email: client.email,
          reason: "Email already exists in Customer table",
        });
        continue;
      }

      try {
        const hashedPassword = await bcrypt.hash(client.phone, 10);

        await Customer.create({
          fullName: client.name,
          email: client.email,
          phone: client.phone,
          country: client.country,
          password: hashedPassword,
          status: "pending",
          fresh_lead_id: client.fresh_lead_id, // ✅ critical fix here
        });

        importedCount++;
      } catch (err) {
        errors.push({
          email: client.email,
          reason: err.message,
        });
      }
    }

    return res.status(200).json({
      message: "Import completed.",
      imported: importedCount,
      skipped: skippedCount,
      errors,
    });
  } catch (error) {
    console.error("❌ Error in importConvertedClientsToCustomers:", error);
    return res.status(500).json({
      message: "Failed to import converted clients.",
      error: error.message,
    });
  }
};

//new one api to assign converted leads to a particular process person

const importConvertedClientsToProcessPerson = async (req, res) => {
  try {
    const { processPersonId, selectedClientIds = [] } = req.body;
    const { ConvertedClient, Customer, ProcessPerson } = req.db;

    if (!processPersonId || !Array.isArray(selectedClientIds)) {
      return res
        .status(400)
        .json({ message: "Missing processPersonId or client IDs" });
    }

    const processPerson = await ProcessPerson.findByPk(processPersonId);
    if (!processPerson) {
      return res.status(404).json({ message: "Process person not found" });
    }

    const convertedClients = await ConvertedClient.findAll({
      where: { id: selectedClientIds },
    });

    if (!convertedClients.length) {
      return res.status(404).json({ message: "No converted clients found" });
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const client of convertedClients) {
      try {
        const existing = await Customer.findOne({
          where: { email: client.email },
        });

        if (existing) {
          skipped++;
          errors.push({
            email: client.email,
            reason: "Email already exists in Customer table",
          });
          continue;
        }

        const hashedPassword = await bcrypt.hash(client.phone, 10);

        await Customer.create({
          fullName: client.name,
          email: client.email,
          phone: client.phone,
          country: client.country,
          password: hashedPassword,
          status: "pending",
          fresh_lead_id: client.fresh_lead_id,
          process_person_id: processPersonId,
        });

        // Update assignedTo in ConvertedClient table
        await ConvertedClient.update(
          { assignedTo: processPerson.fullName },
          { where: { id: client.id } }
        );

        imported++;
      } catch (err) {
        errors.push({
          email: client.email || "unknown",
          reason: err.message,
        });
      }
    }

    return res.status(200).json({
      message: "Import completed",
      imported,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("❌ importConvertedClientsToProcessPerson error:", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      message: "Internal server error during import",
      error: error.message,
    });
  }
};

const getAllProcessPersons = async (req, res) => {
  try {
    const { ProcessPerson } = req.db;
    const processPersons = await ProcessPerson.findAll({
      attributes: {
        exclude: ["password"],
      },
    });
    res.status(200).json({
      message: "Process Persons retrieved sucessfully",
      processPersons,
    });
  } catch (error) {
    console.error("Error fetching managers:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const toggleProcessPersonLoginAccess = async (req, res) => {
  try {
    const { ProcessPerson } = req.db;

    // ✳️ Only Admins are allowed
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Only Admin can change login access." });
    }

    const { processPersonId, can_login } = req.body;

    const person = await ProcessPerson.findByPk(processPersonId);

    if (!person) {
      return res.status(404).json({ message: "Process Person not found." });
    }

    person.can_login = can_login;
    await person.save();

    res.status(200).json({
      message: `Process Person login access updated to '${can_login}'`,
      processPerson: {
        id: person.id,
        fullName: person.fullName,
        email: person.email,
        can_login: person.can_login,
      },
    });
  } catch (error) {
    console.error("Error toggling Process Person login access:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getProcessPersonById = async (req, res) => {
  try {
    const ProcessPerson = req.db.ProcessPerson;
    const processPersonId = req.params.id;
    const requestingUser = req.user;

    // Restrict Process Person from accessing other Process Persons profiles
    if (
      requestingUser.type === "processperson" &&
      requestingUser.id !== parseInt(processPersonId, 10)
    ) {
      return res.status(403).json({ message: "Access denied." });
    }

    const processPerson = await ProcessPerson.findOne({
      where: { id: processPersonId },
      attributes: ["id", "fullName", "email", "createdAt"],
    });

    if (!processPerson) {
      return res.status(404).json({ message: "Process Person not found." });
    }

    // ✅ Send the response
    return res.status(200).json({ processPerson });
  } catch (error) {
    console.error("Error fetching process person:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const updateProcessPersonProfile = async (req, res) => {
  try {
    const ProcessPerson = req.db.ProcessPerson;
    const processPersonId = parseInt(req.params.id, 10);
    const requestingUser = req.user;

    // Only the logged-in Process Person can update their own profile
    if (requestingUser.id !== processPersonId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const processPerson = await ProcessPerson.findByPk(processPersonId);
    if (!processPerson) {
      return res.status(404).json({ message: "Process Person not found." });
    }

    const {
      fullName,
      email,
      nationality,
      dob,
      phone,
      passportNumber,
      profession,
      location,
    } = req.body;

    // Update only allowed fields if present in request
    processPerson.fullName = fullName || processPerson.fullName;
    processPerson.email = email || processPerson.email;
    processPerson.nationality = nationality || processPerson.nationality;
    processPerson.dob = dob || processPerson.dob;
    processPerson.phone = phone || processPerson.phone;
    processPerson.passportNumber =
      passportNumber || processPerson.passportNumber;
    processPerson.profession = profession || processPerson.profession;
    processPerson.location = location || processPerson.location;

    await processPerson.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      processPerson,
    });
  } catch (error) {
    console.error("Error updating process person profile:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const getProcessPersonLoginStatus = async (req, res) => {
  try {
    const ProcessPerson = req.db.ProcessPerson;
    const processPersonId = parseInt(req.params.id, 10);

    if (!processPersonId) {
      return res.status(400).json({
        message: "Process Person ID is required",
      });
    }

    const processPerson = await ProcessPerson.findByPk(processPersonId, {
      attributes: ["id", "fullName", "email", "can_login"],
    });

    if (!processPerson) {
      return res.status(404).json({ message: "Process Person not found" });
    }

    res.status(200).json({
      message: "Process Person status retrieved successfully",
      processPerson,
    });
  } catch (error) {
    console.error("Error getting Process Person login status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const changeProcessPersonPassword = async (req, res) => {
  try {
    const ProcessPerson = req.db.ProcessPerson; // ✅ Scoped model
    const { currentPassword, newPassword } = req.body;
    const { id } = req.user; // ✅ User ID from token

    if (!id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const processPerson = await ProcessPerson.findByPk(id);
    if (!processPerson) {
      return res.status(404).json({ message: "Process Person not found" });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      processPerson.password
    );
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    processPerson.password = await bcrypt.hash(newPassword, 10);
    await processPerson.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error); // ✅ Error log
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProcessPersonCustomers = async (req, res) => {
  try {
    const processPersonId = req.user?.id;
    //const Customer = req.db.Customer;
    const { ProcessFollowUpHistory, Customer, FreshLead, Lead, ClientLead } =
      req.db;

    const customers = await Customer.findAll({
      where: { process_person_id: processPersonId },
      attributes: [
        "id",
        "fullName",
        "email",
        "phone",
        "status",
        "country",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: ProcessFollowUpHistory,
          as: "processfollowuphistories",
          attributes: ["follow_up_type", "interaction_rating"],
          limit: 1,
          separate: true,
          order: [["createdAt", "DESC"]],
        },
        {
          model: FreshLead,
          as: "freshLead",
          attributes: ["name"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["id"],
              include: [
                {
                  model: ClientLead,
                  as: "clientLead",
                  attributes: ["education", "experience", "state", "dob"],
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!customers || customers.length === 0) {
      return res.status(200).json({ customers: [] });
    }

    return res.status(200).json({ customers });
  } catch (error) {
    console.error("Fetch all customers error:", {
      message: error.message,
      stack: error.stack,
      sql: error?.sql,
    });
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  signupProcessPerson,
  loginProcessPerson,
  logoutProcessPerson,
  getProcessSettings,
  updateProcessSettings,
  importConvertedClientsToCustomers,
  getAllConvertedClients,
  getAllProcessPersons,
  toggleProcessPersonLoginAccess,
  getProcessPersonById,
  updateProcessPersonProfile,
  getProcessPersonLoginStatus,
  changeProcessPersonPassword,
  importConvertedClientsToProcessPerson,
  getProcessPersonCustomers,
};
