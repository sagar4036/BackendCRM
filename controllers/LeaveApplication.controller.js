const createLeaveApplication = async (req, res) => {
  try {
    const { LeaveApplication, Users, Notification } = req.db;
    const employeeId = req.user?.id;
    const role = req.user?.role;

    if (!employeeId || !role) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Missing user info in token" });
    }

    const {
      fullName,
      positionTitle,
      leaveType,
      startDate,
      endDate,
      totalDays,
      appliedDate,
      reason,
      emergencyContactName,
      emergencyPhone,
      workHandoverTo,
      handoverNotes,
      supportingDocumentPath,
    } = req.body;

    // ✅ Validation
    if (
      !fullName ||
      !positionTitle ||
      !leaveType ||
      !startDate ||
      !endDate ||
      !totalDays ||
      !appliedDate ||
      !reason ||
      !emergencyContactName ||
      !emergencyPhone
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Ensure employee exists
    const user = await Users.findByPk(employeeId);
    if (!user) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // ✅ Create leave application
    const newLeave = await LeaveApplication.create({
      employeeId,
      fullName,
      role,
      positionTitle,
      leaveType,
      startDate,
      endDate,
      totalDays,
      appliedDate,
      reason,
      emergencyContactName,
      emergencyPhone,
      workHandoverTo,
      handoverNotes,
      supportingDocumentPath,
    });

    // ✅ Create notification for customer
    await Notification.create({
      message: `New ${leaveType} Application by ${fullName} (ID: ${employeeId}) from ${startDate} to ${endDate} (${totalDays} days)`,
      targetRole: "hr",
    });

    return res.status(201).json({
      message: "Leave application submitted successfully",
      data: newLeave,
    });
  } catch (error) {
    console.error("Create leave error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getLeaveApplication = async (req, res) => {
  try {
    const { LeaveApplication, Users } = req.db;
    const { employeeId } = req.query;

    if (!employeeId) {
      return res.status(400).json({ error: "Missing employeeId in query" });
    }

    const employee = await Users.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const leaves = await LeaveApplication.findAll({
      where: { employeeId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(leaves);
  } catch (error) {
    console.error("Get leave error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { LeaveApplication } = req.db;
    const { leaveId, status, hrComment } = req.body;

    // ✅ Validate presence
    if (!leaveId || !status) {
      return res
        .status(400)
        .json({ error: "Both leaveId and status are required" });
    }

    // ✅ Validate status
    const validStatuses = ["Approved", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status. Use 'Approved' or 'Rejected'" });
    }

    // ✅ Find the leave application
    const leave = await LeaveApplication.findByPk(leaveId);
    if (!leave) {
      return res.status(404).json({ error: "Leave application not found" });
    }

    // ✅ Update status and HR comment
    leave.status = status;
    if (hrComment) {
      leave.hrComment = hrComment;
    }
    await leave.save();

    return res.status(200).json({
      message: `Leave status updated to ${status}`,
      data: leave,
    });
  } catch (error) {
    console.error("Update leave status error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createLeaveApplication,
  getLeaveApplication,
  updateLeaveStatus,
};