const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const signupHr = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const Hr = req.db.Hr;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingHr = await Hr.findOne({ where: { email } });
    if (existingHr) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hr = await Hr.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "HR registered successfully.",
      hr: {
        id: hr.id,
        name: hr.name,
        email: hr.email,
      },
    });
  } catch (err) {
    console.error("HR Signup error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const loginHr = async (req, res) => {
  try {
    const { email, password } = req.body;
    const Hr = req.db.Hr;

    const hr = await Hr.findOne({ where: { email } });
    if (!hr) {
      return res.status(404).json({ error: "HR not found." });
    }

    if (!hr.can_login) {
      return res
        .status(403)
        .json({ message: "Login access is disabled. Please contact admin." });
    }

    const isMatch = await bcrypt.compare(password, hr.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      {
        id: hr.id,
        email: hr.email,
        name: hr.name,
        role: hr.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.cookie("hr_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 12 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful.",
      token,
      hr: {
        id: hr.id,
        email: hr.email,
        name: hr.name,
        role: hr.role,
      },
    });
  } catch (err) {
    console.error("HR Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const logoutHr = async (req, res) => {
  try {
    res.clearCookie("hr_token", {
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

const getHrProfile = async (req, res) => {
  try {
    const HR = req.db.Hr;
    const hrId = req.user.id; // assumes auth middleware sets req.user

    const hr = await HR.findByPk(hrId, {
      attributes: ["id", "name", "email", "username", "role", "jobTitle"], // added username and jobTitle
    });

    if (!hr) {
      return res.status(404).json({ error: "HR not found." });
    }

    res.status(200).json({ hr });
  } catch (err) {
    console.error("Get HR profile error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getAllHrs = async (req, res) => {
  try {
    const HR = req.db.Hr;
    const hrs = await HR.findAll({
      attributes: {
        exclude: ["password"],
      },
    });

    res.status(200).json({
      message: "Hrs retrieved successfully",
      hrs,
    });
  } catch (error) {
    console.error("Error fetching managers:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const toggleHrLoginAccess = async (req, res) => {
  try {
    const Hr = req.db.Hr;

    // ✳️ Only Admins are allowed
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Only Admin can change login access." });
    }

    const { hrId, can_login } = req.body;

    const hr = await Hr.findByPk(hrId);

    if (!hr) {
      return res.status(404).json({ message: "HR user not found." });
    }

    hr.can_login = can_login;
    await hr.save();

    res.status(200).json({
      message: `HR login access updated to '${can_login}'`,
      hr: {
        id: hr.id,
        name: hr.name,
        email: hr.email,
        can_login: hr.can_login,
      },
    });
  } catch (error) {
    console.error("Error toggling HR login access:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getHrById = async (req, res) => {
  try {
    const Hr = req.db.Hr;
    const hrId = req.params.id;
    const requestingUser = req.user;
    // Restrict Hr from accessing other Hr profiles
    if (
      requestingUser.role === "HR" &&
      requestingUser.id !== parseInt(hrId, 10)
    ) {
      return res.status(403).json({ message: "Access denied." });
    }

    const hr = await Hr.findOne({
      where: { id: hrId },
      attributes: ["id", "name", "email", "username", "role", "jobTitle", "createdAt"], // added username and jobTitle
    });

    if (!hr) {
      return res.status(404).json({ message: "Hr not found." });
    }

    // ✅ Send the response
    return res.status(200).json({ hr });
  } catch (error) {
    console.error("Error fetching Hrs:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const updateHrProfile = async (req, res) => {
  try {
    const Hr = req.db.Hr;
    const hrId = parseInt(req.params.id, 10);
    const requestingUser = req.user;

    // Restrict: Only the logged-in HR can update their own profile
    if (requestingUser.id !== hrId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const hr = await Hr.findByPk(hrId);
    if (!hr) {
      return res.status(404).json({ message: "HR not found." });
    }

    const { name, email, username, jobTitle } = req.body;

    // Update fields only if provided
    hr.name = name || hr.name;
    hr.email = email || hr.email;
    hr.username = username || hr.username;
    hr.jobTitle = jobTitle || hr.jobTitle;

    await hr.save();

    return res
      .status(200)
      .json({ message: "Profile updated successfully.", hr });
  } catch (error) {
    console.error("Error updating HR profile:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const getHrLoginStatus = async (req, res) => {
  try {
    const Hr = req.db.Hr;
    const hrId = parseInt(req.params.id, 10);

    if (!hrId) {
      return res.status(400).json({
        message: "Hr ID is required",
      });
    }

    const hr = await Hr.findByPk(hrId, {
      attributes: ["id", "name", "email", "role", "can_login"],
    });

    if (!hr) {
      return res.status(404).json({ message: "Hr not found" });
    }

    res.status(200).json({
      message: "Hr status retrieved successfully",
      hr,
    });
  } catch (error) {
    console.error("Error getting hr login status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const changeHrPassword = async (req, res) => {
  try {
    const Hr = req.db.Hr; // ✅ Scoped model
    const { currentPassword, newPassword } = req.body;
    const { id } = req.user; // ✅ User ID from token

    if (!id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const hr = await Hr.findByPk(id);
    if (!hr) {
      return res.status(404).json({ message: "Hr not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, hr.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    hr.password = await bcrypt.hash(newPassword, 10);
    await hr.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error); // ✅ Error log
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  signupHr,
  loginHr,
  logoutHr,
  getHrProfile,
  getAllHrs,
  toggleHrLoginAccess,
  getHrById,
  updateHrProfile,
  getHrLoginStatus,
  changeHrPassword,
};