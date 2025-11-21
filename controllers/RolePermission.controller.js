const db = require("../config/sequelize"); // Adjust the path to your DB if different
const { Op } = require("sequelize");

exports.createRolePermission = async (req, res) => {
  const RolePermission = req.db.RolePermission;
  const { Op } = require("sequelize");
  const { v4: uuidv4 } = require("uuid");

  try {
    const { manager_id, user_id, hr_id, role } = req.body;

    const allowedRoles = ["Manager", "TL", "HR", "Executive"];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role provided. Allowed roles are: ${allowedRoles.join(
          ", "
        )}`,
      });
    }

    // Determine which ID is provided based on role
    let idField, idValue;

    // Dynamically detect which ID to use
    if (role === "Manager" && manager_id) {
      idField = "manager_id";
      idValue = manager_id;
    } else if (role === "HR" && hr_id) {
      idField = "hr_id";
      idValue = hr_id;
    } else if (["Executive", "TL"].includes(role) && user_id) {
      idField = "user_id";
      idValue = user_id;
    } else {
      return res.status(400).json({
        message: `Missing ID for role '${role}'.`,
      });
    }

    // Check for duplicate
    const existing = await RolePermission.findOne({
      where: {
        [idField]: idValue,
        role,
      },
    });

    if (existing) {
      return res.status(409).json({
        message: `RolePermission for ${idField} ${idValue} with role '${role}' already exists.`,
      });
    }

    // Prepare payload
    const payload = {
      id: uuidv4(),
      role,
      overview: false,
      assign_task: false,
      task_management: false,
      monitoring: false,
      executive_details: false,
      invoice: false,
      dashboard: false,
      user_management: false,
      reporting: false,
      settings: false,
      billing: false,
      weekly_summary: false,
      account_updates: false,
      marketing_emails: false,
      push_notifications: false,
      sms_notifications: false,
      email_notifications: false,
    };

    payload[idField] = idValue;

    const newPermission = await RolePermission.create(payload);

    res.status(201).json({
      message: "RolePermission created successfully.",
      record: newPermission,
    });
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.togglePermission = async (req, res) => {
  const RolePermission = req.db.RolePermission;
  try {
    const { id } = req.params; // RolePermission record ID
    const { permissionKey } = req.body; // permission column name like "dashboard"

    // Ensure the permissionKey is valid
    const validPermissions = [
      "overview",
      "assign_task",
      "task_management",
      "monitoring",
      "executive_details",
      "invoice",
      "dashboard",
      "user_management",
      "reporting",
      "settings",
      "billing",
      "weekly_summary",
      "account_updates",
      "marketing_emails",
      "push_notifications",
      "sms_notifications",
      "email_notifications",
      "create_user",
      "page_access",
    ];

    if (!validPermissions.includes(permissionKey)) {
      return res.status(400).json({ message: "Invalid permission key." });
    }

    // Fetch existing RolePermission record
    const record = await RolePermission.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Permission record not found." });
    }

    // Toggle the permission
    record[permissionKey] = !record[permissionKey];
    await record.save();

    res.status(200).json({
      message: `Permission '${permissionKey}' toggled successfully.`,
      updatedRecord: record,
    });
  } catch (error) {
    console.error("Toggle error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// exports.getAllRolePermissions = async (req, res) => {
//   const RolePermission = req.db.RolePermission;

//   try {
//     const permissions = await RolePermission.findAll({
//       attributes: ["id", "role", "manager_id", "user_id", "hr_id"],
//     });

//     const formatted = permissions.map((p) => ({
//       id: p.id,
//       label: `Role: ${p.role} | ${
//         p.manager_id
//           ? "Manager ID: " + p.manager_id
//           : p.hr_id
//           ? "HR ID: " + p.hr_id
//           : "User ID: " + p.user_id
//       }`,
//     }));

//     res.status(200).json(formatted);
//   } catch (error) {
//     console.error("Error fetching permissions:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

//fetching permission only by id

exports.getAllRolePermissions = async (req, res) => {
  const { RolePermission, Users, Manager, Hr } = req.db;

  try {
    const permissions = await RolePermission.findAll({
      attributes: ["id", "role", "manager_id", "user_id", "hr_id"],
    });

    // Collect unique IDs to fetch names in batch
    const userIds = permissions.map((p) => p.user_id).filter(Boolean);
    const managerIds = permissions.map((p) => p.manager_id).filter(Boolean);
    const hrIds = permissions.map((p) => p.hr_id).filter(Boolean);

    // Fetch names for users, managers, hrs
    const users = await Users.findAll({
      where: { id: userIds },
      attributes: ["id", "username"],
    });

    const managers = await Manager.findAll({
      where: { id: managerIds },
      attributes: ["id", "name"],
    });

    const hrs = await Hr.findAll({
      where: { id: hrIds },
      attributes: ["id", "name"],
    });

    // Create lookup maps for quick access
    const userMap = new Map(users.map((u) => [u.id, u.username]));
    const managerMap = new Map(managers.map((m) => [m.id, m.name]));
    const hrMap = new Map(hrs.map((h) => [h.id, h.name]));

    // Format with names
    const formatted = permissions.map((p) => {
      let label = `Role: ${p.role} | `;

      if (p.manager_id && managerMap.has(p.manager_id)) {
        label += `${managerMap.get(p.manager_id)} (ID: ${p.manager_id})`;
      } else if (p.hr_id && hrMap.has(p.hr_id)) {
        label += `${hrMap.get(p.hr_id)} (ID: ${p.hr_id})`;
      } else if (p.user_id && userMap.has(p.user_id)) {
        label += `${userMap.get(p.user_id)} (ID: ${p.user_id})`;
      } else {
        label += "Unknown Role Holder";
      }

      return {
        id: p.id,
        label,
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getPermissionById = async (req, res) => {
  try {
    const userId = req.params.id;
    const RolePermission = req.db.RolePermission;
    const permission = await RolePermission.findOne({
      where: { id: userId },
    });

    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }
    res.status(200).json({ permission });
  } catch (error) {
    console.error("Error fetching Permissions:", error);
    res.status(500).json({ message: "Server error." });
  }
};

//fetching permission with id and role
exports.getPermissionByRoleAndId = async (req, res) => {
  const { role, id } = req.params;
  const RolePermission = req.db.RolePermission;

  try {
    let condition = {};

    // Determine the correct field based on role
    if (role === "Manager") {
      condition = { role, manager_id: id };
    } else if (role === "HR") {
      condition = { role, hr_id: id };
    } else if (role === "TL") {
      condition = { role, user_id: id };
    } else if (role === "Executive") {
      condition = { role, user_id: id };
    } else {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const permission = await RolePermission.findOne({
      where: condition,
    });

    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }

    res.status(200).json(permission);
  } catch (error) {
    console.error("Error fetching permission:", error);
    res.status(500).json({ message: "Server error while fetching permission" });
  }
};

// exports.getAllUsersHrsAndManagers = async (req, res) => {
//   const User = req.db.Users;
//   const Manager = req.db.Manager;
//   const Hr = req.db.Hr;

//   try {
//     // Fetch users with their roles
//     const users = await User.findAll({
//       attributes: ["id", "role"],
//       where: {
//         role: {
//           [Op.notIn]: ["Admin"],
//         },
//       },
//     });

//     // Fetch managers (role = Manager)
//     const managers = await Manager.findAll({
//       attributes: ["id"],
//     });

//     //Fetch Hrs (role = Hr)
//     const hrs = await Hr.findAll({
//       attributes: ["id"],
//     });

//     // Format users: "Executive - id - 2", "TL - id - 5", etc.
//     const userOptions = users.map((user) => ({
//       id: user.id,
//       label: `id - ${user.id} - ${user.role}`,
//     }));

//     // Format managers: "Manager - id - 2"
//     const managerOptions = managers.map((manager) => ({
//       id: manager.id,
//       label: `id - ${manager.id} - Manager`,
//     }));

//     // Format HRs
//     const hrOptions = hrs.map((hr) => ({
//       id: hr.id,
//       label: `id - ${hr.id} - HR`,
//     }));

//     // Combine both lists
//     const combinedOptions = [...userOptions, ...managerOptions, ...hrOptions];

//     res.status(200).json(combinedOptions);
//   } catch (error) {
//     console.error("Error generating dropdown options:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

exports.getAllUsersHrsAndManagers = async (req, res) => {
  const User = req.db.Users;
  const Manager = req.db.Manager;
  const Hr = req.db.Hr;
  const RolePermission = req.db.RolePermission;

  try {
    // Step 1: Fetch all RolePermissions to get already assigned IDs
    const rolePermissions = await RolePermission.findAll({
      attributes: ["user_id", "manager_id", "hr_id"],
    });

    const assignedUserIds = rolePermissions
      .filter((rp) => rp.user_id !== null)
      .map((rp) => rp.user_id);

    const assignedManagerIds = rolePermissions
      .filter((rp) => rp.manager_id !== null)
      .map((rp) => rp.manager_id);

    const assignedHrIds = rolePermissions
      .filter((rp) => rp.hr_id !== null)
      .map((rp) => rp.hr_id);

    // Step 2: Fetch users whose permissions are NOT yet created
    const users = await User.findAll({
      attributes: ["id", "role", "username"],
      where: {
        role: {
          [Op.notIn]: ["Admin"],
        },
        id: {
          [Op.notIn]: assignedUserIds.length ? assignedUserIds : [0], // If empty, provide dummy ID to avoid SQL error
        },
      },
    });

    const managers = await Manager.findAll({
      attributes: ["id", "name"],
      where: {
        id: {
          [Op.notIn]: assignedManagerIds.length ? assignedManagerIds : [0],
        },
      },
    });

    const hrs = await Hr.findAll({
      attributes: ["id", "name"],
      where: {
        id: {
          [Op.notIn]: assignedHrIds.length ? assignedHrIds : [0],
        },
      },
    });

    // Step 3: Format options
    const userOptions = users.map((user) => ({
      id: user.id,
      label: `id - ${user.id} - ${user.role} - ${user.username}`,
    }));

    const managerOptions = managers.map((manager) => ({
      id: manager.id,
      label: `id - ${manager.id} - Manager - ${manager.name}`,
    }));

    const hrOptions = hrs.map((hr) => ({
      id: hr.id,
      label: `id - ${hr.id} - HR - ${hr.name}`,
    }));

    // Step 4: Combine
    const combinedOptions = [...userOptions, ...managerOptions, ...hrOptions];

    res.status(200).json(combinedOptions);
  } catch (error) {
    console.error("Error generating dropdown options:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
