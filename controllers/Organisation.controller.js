const { Op } = require("sequelize");

const getOrganizationHierarchy = async (req, res) => {
  try {
    const { Users, Manager, Hr, ProcessPerson, Team } = req.db;
    const requestingUser = req.user;

    // Restrict access: Only Admins can view the full hierarchy
    if (requestingUser.role !== "Admin") {
      return res.status(403).json({
        message:
          "Unauthorized: Only Admins can view the organization hierarchy.",
      });
    }

    // Fetch all Admins
    const admins = await Users.findAll({
      where: { role: "Admin" },
      attributes: ["id", "username", "role"],
    });

    // Fetch all Managers
    const managers = await Manager.findAll({
      attributes: ["id", "name", "role"],
    });

    // Fetch all TLs
    const tls = await Users.findAll({
      where: { role: "TL" },
      attributes: ["id", "username", "role"],
    });

    // Fetch all Executives with their associated team
    const executives = await Users.findAll({
      where: { role: "Executive" },
      attributes: ["id", "username", "role", "team_id"],
      include: [
        {
          model: Team,
          as: "team",
          attributes: ["id", "name", "manager_id"],
          required: false, // Handle Executives without a team
        },
      ],
    });

    // Fetch all HRs
    const hrs = await Hr.findAll({
      attributes: ["id", "name", "role"],
    });

    // Fetch all Process Persons (without role field)
    const processPersons = await ProcessPerson.findAll({
      attributes: ["id", "fullName"],
    });

    // Build the hierarchy
    const hierarchy = admins.map((admin) => ({
      id: admin.id,
      name: admin.username,
      role: admin.role,
      children: [
        // Managers under Admin
        ...managers.map((manager) => ({
          id: manager.id,
          name: manager.name,
          role: manager.role,
          children: [
            // Executives under Manager (based on team.manager_id)
            ...executives
              .filter(
                (executive) =>
                  executive.team && executive.team.manager_id === manager.id
              )
              .map((executive) => ({
                id: executive.id,
                name: executive.username,
                role: executive.role,
                team: executive.team ? executive.team.name : null,
              })),
          ],
        })),
        // TLs under Admin
        ...tls.map((tl) => ({
          id: tl.id,
          name: tl.username,
          role: tl.role,
        })),
        // HRs under Admin
        ...hrs.map((hr) => ({
          id: hr.id,
          name: hr.name,
          role: hr.role,
        })),
        // Process Persons under Admin (with fixed role as "ProcessPerson")
        ...processPersons.map((processPerson) => ({
          id: processPerson.id,
          name: processPerson.fullName,
          role: "ProcessPerson", // Hardcode role since it’s not in the database
        })),
      ],
    }));

    return res.status(200).json({
      message: "Organization hierarchy retrieved successfully.",
      hierarchy,
    });
  } catch (error) {
    console.error("Error fetching organization hierarchy:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

module.exports = {
  getOrganizationHierarchy,
};
