const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

require("dotenv").config();

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    const Customer = req.db.Customer; // Dynamically selected table for Customer

    // Find the customer by email and check if the status is "approved"
    const customer = await Customer.findOne({
      where: { email },
    });

    if (!customer) {
      return res
        .status(404)
        .json({ message: "Customer not found or not approved" });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create a JWT token
    const token = jwt.sign(
      {
        id: customer.id,
        email: customer.email,
        fullName: customer.fullName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    // Set the token as a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 12 * 60 * 60 * 1000, // Token expires in 12 hours
    });

    res.status(200).json({
      message: "Login successful",
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        fullName: customer.fullName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const signupCustomer = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const Customer = req.db.Customer; // Dynamically selected table for Customer

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        error: "Full Name, Email, and Password are required fields.",
      });
    }

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if the email already exists
    const existingCustomer = await Customer.findOne({ where: { email } });

    if (existingCustomer) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new customer with status as "pending" by default
    const customer = await Customer.create({
      fullName,
      email,
      password: hashedPassword,
      status: "pending", // Default status
    });

    return res.status(201).json({
      message: "Customer created successfully",
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        status: customer.status,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    let errorMessage = "Internal server error";
    if (error.name === "SequelizeValidationError") {
      errorMessage = error.errors.map((e) => e.message).join(", ");
    } else if (error.name === "SequelizeUniqueConstraintError") {
      errorMessage = "Email already exists";
    }
    return res.status(500).json({ error: errorMessage });
  }
};

const logoutCustomer = async (req, res) => {
  try {
    const Customer = req.db.Customer; // ✅ Use dynamic tenant database
    const customerId = req.user.id; // Assumes authentication middleware adds `req.user`

    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    //const Customer = req.db.Customer;
    const { ProcessFollowUpHistory, Customer, FreshLead, Lead, ClientLead } =
      req.db;

    const customers = await Customer.findAll({
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
          attributes: ["follow_up_type"],
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
      return res.status(404).json({ message: "No customers found" });
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

const changePassword = async (req, res) => {
  try {
    const Customer = req.db.Customer;
    const { currentPassword, newPassword } = req.body;
    const { id } = req.user;

    if (!id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    customer.password = await bcrypt.hash(newPassword, 10);
    await customer.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error); // ✅ Error log
    return res.status(500).json({ message: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const Customer = req.db.Customer;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const customer = await Customer.findOne({ where: { email } });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    await customer.update({
      resetPasswordToken: resetToken,
      resetPasswordExpiry: resetTokenExpiry,
    });

    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Click this link to reset your password: ${resetUrl}\nThis link expires in 1 hour.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", {
      message: error.message,
      stack: error.stack,
      sql: error?.sql,
    });
    res.status(500).json({ error: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const Customer = req.db.Customer;
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and new password are required" });
    }

    const customer = await Customer.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: {
          [Op.gt]: Date.now(), // Token must not be expired
        },
      },
    });

    if (!customer) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await customer.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpiry: null,
    });

    res.status(200).json({ message: "Password successfully reset" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 Mark customer as "under_review"
const markAsUnderReview = async (req, res) => {
  const Customer = req.db.Customer;
  const { id } = req.params;

  try {
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    customer.status = "under_review";
    await customer.save();

    return res
      .status(200)
      .json({ message: "Status updated to under_review", customer });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// 📌 Mark customer as "approved"
const markAsApproved = async (req, res) => {
  const Customer = req.db.Customer;
  const { id } = req.params;

  try {
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    customer.status = "approved";
    await customer.save();

    return res
      .status(200)
      .json({ message: "Status updated to approved", customer });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// 📌 Mark customer as "rejected"
const markAsRejected = async (req, res) => {
  const Customer = req.db.Customer;
  const { id } = req.params;

  try {
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    customer.status = "rejected";
    await customer.save();

    return res
      .status(200)
      .json({ message: "Status updated to rejected", customer });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// 📌 Mark customer as "meeting"
const markAsMeeting = async (req, res) => {
  const Customer = req.db.Customer;
  const { id } = req.params;

  try {
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    customer.status = "meeting";
    await customer.save();

    return res
      .status(200)
      .json({ message: "Status updated to meeting", customer });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  loginCustomer,
  signupCustomer,
  logoutCustomer,
  getAllCustomers,
  changePassword,
  forgotPassword,
  resetPassword,
  markAsUnderReview,
  markAsApproved,
  markAsRejected,
  markAsMeeting,
};
