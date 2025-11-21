const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendTeamAssignmentEmail } = require("../services/emailService");

const signupManager = async (req, res) => {
  try {
    const { name, email, password, username, jobTitle } = req.body;
    const Manager = req.db.Manager;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingManager = await Manager.findOne({ where: { email } });
    if (existingManager) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // Check if username already exists (if provided)
    if (username) {
      const existingUsername = await Manager.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken." });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const manager = await Manager.create({
      name,
      username,
      email,
      password: hashedPassword,
      jobTitle,
    });

    res.status(201).json({
      message: "Manager registered successfully.",
      manager: {
        id: manager.id,
        name: manager.name,
        username: manager.username,
        email: manager.email,
        jobTitle: manager.jobTitle,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const loginManager = async (req, res) => {
  try {
    const { email, password } = req.body;
    const Manager = req.db.Manager;

    const manager = await Manager.findOne({ where: { email } });
    if (!manager) {
      return res.status(404).json({ error: "Manager not found." });
    }

    if (!manager.can_login) {
      return res
        .status(403)
        .json({ message: "Login access is disabled. Please contact admin." });
    }

    const isMatch = await bcrypt.compare(password, manager.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      {
        id: manager.id,
        email: manager.email,
        name: manager.name,
        username: manager.username,
        role: manager.role,
        jobTitle: manager.jobTitle,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.cookie("manager_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 12 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful.",
      token,
      manager: {
        id: manager.id,
        email: manager.email,
        name: manager.name,
        username: manager.username,
        role: manager.role,
        jobTitle: manager.jobTitle,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const logoutManager = async (req, res) => {
  try {
    res.clearCookie("manager_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });

    res.status(200).json({ message: "Logout successful." });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const createTeam = async (req, res) => {
  try {
    const { name, managerId } = req.body;
    const Team = req.db.Team;

    if (req.user.role != "Admin") {
      return res.status(401).json({ error: "Only admin can Create a Team" });
    }

    if (!name) {
      return res.status(400).json({ error: "Team name is required." });
    }

    const team = await Team.create({
      name,
      manager_id: managerId,
    });

    res.status(201).json({
      message: "Team created successfully.",
      team: team.toJSON(),
    });
  } catch (err) {
    console.error("Create team error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getManagerTeams = async (req, res) => {
  try {
    const Team = req.db.Team;
    const { managerId } = req.body;
    //const managerId = req.user.id;

    const teams = await Team.findAll({ where: { manager_id: managerId } });

    res.status(200).json({ teams });
  } catch (err) {
    console.error("Get teams error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const addExecutiveToTeam = async (req, res) => {
  try {
    const { team_id, user_id, managerId } = req.body;
    const Team = req.db.Team;
    const Users = req.db.Users;
    const Manager = req.db.Manager;

    if (req.user.role != "Admin") {
      return res
        .status(401)
        .json({ error: "Only admin can add Executives in a Team" });
    }

    // Validation
    if (!team_id || !user_id || !managerId) {
      return res
        .status(400)
        .json({ error: "Team ID, User ID and Manager Id is required." });
    }

    // Verify ownership
    const team = await Team.findOne({
      where: { id: team_id, manager_id: managerId },
    });
    if (!team) {
      return res
        .status(403)
        .json({ error: "This manager does not own this team." });
    }

    const manager = await Manager.findByPk(managerId);

    const user = await Users.findOne({
      where: { id: user_id, role: "Executive" },
    });
    if (!user) {
      return res.status(404).json({ error: "Executive not found." });
    }

    // Assign team
    user.team_id = team_id;
    await user.save();

    // Send team assignment email
    if (user.email) {
      await sendTeamAssignmentEmail(
        user.email,
        user.firstname || user.username,
        team.name,
        manager.name
      );
    }

    res.status(200).json({
      message: "Executive assigned to team and notified via email.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        team_id: user.team_id,
      },
    });
  } catch (err) {
    console.error("Add executive error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getManagerProfile = async (req, res) => {
  try {
    const Manager = req.db.Manager;
    const managerId = req.user.id; // from token middleware

    const manager = await Manager.findByPk(managerId, {
      attributes: [
        "id",
        "name",
        "username",
        "email",
        "role",
        "jobTitle",
        "createdAt",
      ],
    });

    if (!manager) {
      return res.status(404).json({ error: "Manager not found." });
    }

    res.status(200).json({ manager });
  } catch (err) {
    console.error("Get manager profile error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getAllManagers = async (req, res) => {
  try {
    const Manager = req.db.Manager;
    const managers = await Manager.findAll({
      attributes: {
        exclude: ["password"],
      },
    });
    res.status(200).json({
      message: "Managers retrieved successfully",
      managers,
    });
  } catch (error) {
    console.error("Error fetching managers:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const toggleManagerLoginAccess = async (req, res) => {
  try {
    const Manager = req.db.Manager;

    // ✳️ Only Admins are allowed
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Only Admin can change login access." });
    }

    const { managerId, can_login } = req.body;

    const manager = await Manager.findByPk(managerId);

    if (!manager) {
      return res.status(404).json({ message: "User not found." });
    }

    manager.can_login = can_login;
    await manager.save();

    res.status(200).json({
      message: `Manager login access updated to '${can_login}'`,
      manager: {
        id: manager.id,
        username: manager.username,
        email: manager.email,
        can_login: manager.can_login,
      },
    });
  } catch (error) {
    console.error("Error toggling login access:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllTeamMember = async (req, res) => {
  try {
    const { team_id } = req.body;
    const Users = req.db.Users;
    if (!team_id) {
      return res
        .status(400)
        .json({ error: "team_id is required in request body" });
    }

    const teamMembers = await Users.findAll({
      where: {
        team_id,
        role: "Executive", // only executives
      },
      attributes: [
        "id",
        "username",
        "email",
        "firstname",
        "lastname",
        "profile_picture",
      ],
      order: [["username", "ASC"]],
    });

    res.json(teamMembers);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
};

const getManagerById = async (req, res) => {
  try {
    const Manager = req.db.Manager;
    const managerId = req.params.id;
    const requestingUser = req.user;

    // Restrict Manager from accessing other Manager profiles
    if (
      requestingUser.role === "manager" &&
      requestingUser.id !== parseInt(managerId, 10)
    ) {
      return res.status(403).json({ message: "Access denied." });
    }

    const manager = await Manager.findOne({
      where: { id: managerId },
      attributes: [
        "id",
        "name",
        "username",
        "email",
        "role",
        "jobTitle",
        "createdAt",
      ],
    });

    if (!manager) {
      return res.status(404).json({ message: "Manager not found." });
    }

    // ✅ Send the response
    return res.status(200).json({ manager });
  } catch (error) {
    console.error("Error fetching Managers:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const updateManagerProfile = async (req, res) => {
  try {
    const Manager = req.db.Manager;
    const managerId = parseInt(req.params.id, 10);
    const requestingUser = req.user;

    // Restrict access: A manager can only update their own profile
    if (requestingUser.id !== managerId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const manager = await Manager.findByPk(managerId);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found." });
    }

    const { name, username, email, jobTitle } = req.body;

    // Check if username is being updated and if it's unique
    if (username && username !== manager.username) {
      const existingUsername = await Manager.findOne({
        where: { username, id: { [require("sequelize").Op.ne]: managerId } },
      });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken." });
      }
    }

    manager.name = name || manager.name;
    manager.username = username || manager.username;
    manager.email = email || manager.email;
    manager.jobTitle = jobTitle || manager.jobTitle;

    await manager.save();

    return res
      .status(200)
      .json({ message: "Profile updated successfully.", manager });
  } catch (error) {
    console.error("Error updating manager profile:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const getManagerLoginStatus = async (req, res) => {
  try {
    const Manager = req.db.Manager;
    const managerId = parseInt(req.params.id, 10);

    if (!managerId) {
      return res.status(400).json({
        message: "Manager ID is required",
      });
    }

    const manager = await Manager.findByPk(managerId, {
      attributes: [
        "id",
        "name",
        "username",
        "email",
        "role",
        "jobTitle",
        "can_login",
      ],
    });

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    res.status(200).json({
      message: "Manager status retrieved successfully",
      manager,
    });
  } catch (error) {
    console.error("Error getting manager login status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const changeManagerPassword = async (req, res) => {
  try {
    const Manager = req.db.Manager; // ✅ Scoped model
    const { currentPassword, newPassword } = req.body;
    const { id } = req.user; // ✅ User ID from token

    if (!id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const manager = await Manager.findByPk(id);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, manager.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    manager.password = await bcrypt.hash(newPassword, 10);
    await manager.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error); // ✅ Error log
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllTeams = async (req, res) => {
  try {
    const Team = req.db.Team;

    const teams = await Team.findAll({
      order: [["createdAt", "DESC"]], // Optional: latest teams first
    });

    res.status(200).json({ teams });
  } catch (error) {
    console.error("Fetch all teams error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const { id: team_id } = req.params;
    const { Team, Users } = req.db;

    if (!team_id) {
      return res
        .status(400)
        .json({ error: "Team id is required to delete a Team" });
    }

    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this team." });
    }

    const team = await Team.findByPk(team_id);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    await Users.update({ team_id: null }, { where: { team_id: team_id } });

    await team.destroy();

    res.status(200).json({
      message: "Team deleted successfully",
      deletedTeam: {
        id: team.id,
        name: team.name,
      },
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  signupManager,
  loginManager,
  logoutManager,
  createTeam,
  getManagerTeams,
  addExecutiveToTeam,
  getManagerProfile,
  getAllManagers,
  toggleManagerLoginAccess,
  getAllTeamMember,
  getManagerById,
  updateManagerProfile,
  getManagerLoginStatus,
  changeManagerPassword,
  getAllTeams,
  deleteTeam,
};
