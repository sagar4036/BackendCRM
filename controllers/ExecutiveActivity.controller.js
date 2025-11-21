// Required dependencies
const { Op } = require("sequelize");
const {
  parseISO,
  addDays,
  format,
  eachDayOfInterval,
  isWithinInterval,
} = require("date-fns");

// Utility to get today's date in YYYY-MM-DD format
function getTodayDate() {
  return format(new Date(), "yyyy-MM-dd");
}

// Track lead section visits
exports.trackLeadVisit = async (req, res) => {
  try {
    const { ExecutiveId } = req.body;
    const { ExecutiveActivity } = req.db;
    const today = getTodayDate();

    if (!ExecutiveId)
      return res.status(400).json({ message: "ExecutiveId is required" });

    let activity = await ExecutiveActivity.findOne({
      where: { ExecutiveId, activityDate: today },
    });

    if (!activity) {
      activity = await ExecutiveActivity.create({
        ExecutiveId,
        activityDate: today,
        workTime: 0,
        breakTime: 0,
        dailyCallTime: 0,
        leadSectionVisits: 1,
      });
    } else {
      activity.leadSectionVisits += 1;
      await activity.save();
    }

    res.json({ message: "Lead visit tracked", activity });
  } catch (error) {
    res.status(500).json({ message: "Error tracking lead visit", error });
  }
};

// Start work session
exports.startWork = async (req, res) => {
  try {
    const { ExecutiveId } = req.body;
    const { ExecutiveActivity } = req.db;
    const today = getTodayDate();

    if (!ExecutiveId)
      return res.status(400).json({ message: "ExecutiveId is required" });

    let activity = await ExecutiveActivity.findOne({
      where: { ExecutiveId, activityDate: today },
    });

    if (!activity) {
      activity = await ExecutiveActivity.create({
        ExecutiveId,
        activityDate: today,
        workStartTime: new Date(),
        workTime: 0,
        breakTime: 0,
        dailyCallTime: 0,
        leadSectionVisits: 0,
      });
    } else if (!activity.workStartTime) {
      activity.workStartTime = new Date();
      await activity.save();
    }

    res.json({ message: "Work session started", activity });
  } catch (error) {
    res.status(500).json({ message: "Error starting work session", error });
  }
};

// Stop work session
exports.stopWork = async (req, res) => {
  try {
    const { ExecutiveId } = req.body;
    const { ExecutiveActivity } = req.db;
    const today = getTodayDate();

    if (!ExecutiveId)
      return res.status(400).json({ message: "ExecutiveId is required" });

    const activity = await ExecutiveActivity.findOne({
      where: { ExecutiveId, activityDate: today },
    });

    if (!activity || !activity.workStartTime)
      return res.status(400).json({ message: "Work session not started" });

    const workDuration = Math.floor(
      (new Date() - new Date(activity.workStartTime)) / 1000
    );

    activity.workTime += workDuration;
    activity.workStartTime = null;
    await activity.save();

    res.json({ message: "Work session stopped", workDuration, activity });
  } catch (error) {
    res.status(500).json({ message: "Error stopping work session", error });
  }
};

// Start break
exports.startBreak = async (req, res) => {
  try {
    const { ExecutiveId } = req.body;
    const { ExecutiveActivity, Users } = req.db;
    const today = getTodayDate();

    if (!ExecutiveId)
      return res.status(400).json({ message: "ExecutiveId is required" });

    const activity = await ExecutiveActivity.findOne({
      where: { ExecutiveId, activityDate: today },
    });

    if (!activity)
      return res.status(400).json({ message: "No activity found for today" });

    activity.breakStartTime = new Date();
    await activity.save();
    await Users.update({ is_online: false }, { where: { id: ExecutiveId } });

    res.json({ message: "Break started", activity });
  } catch (error) {
    res.status(500).json({ message: "Error starting break", error });
  }
};

// Stop break
exports.stopBreak = async (req, res) => {
  try {
    const { ExecutiveId } = req.body;
    const { ExecutiveActivity, Users } = req.db;
    const today = getTodayDate();

    if (!ExecutiveId)
      return res.status(400).json({ message: "ExecutiveId is required" });

    const activity = await ExecutiveActivity.findOne({
      where: { ExecutiveId, activityDate: today },
    });

    if (!activity || !activity.breakStartTime)
      return res.status(400).json({ message: "Break not started" });

    const breakDuration = Math.floor(
      (new Date() - new Date(activity.breakStartTime)) / 1000
    );

    activity.breakTime += breakDuration;
    activity.breakStartTime = null;
    await activity.save();
    await Users.update({ is_online: true }, { where: { id: ExecutiveId } });

    res.json({ message: "Break stopped", breakDuration, activity });
  } catch (error) {
    res.status(500).json({ message: "Error stopping break", error });
  }
};

// Update call duration
exports.updateCallTime = async (req, res) => {
  try {
    const { ExecutiveId, callDuration } = req.body;
    const { ExecutiveActivity } = req.db;
    const today = getTodayDate();

    if (!ExecutiveId || isNaN(callDuration) || callDuration < 0)
      return res.status(400).json({ message: "Invalid input" });

    let activity = await ExecutiveActivity.findOne({
      where: { ExecutiveId, activityDate: today },
    });

    if (!activity) {
      activity = await ExecutiveActivity.create({
        ExecutiveId,
        activityDate: today,
        workTime: 0,
        breakTime: 0,
        dailyCallTime: callDuration * 60,
        leadSectionVisits: 0,
      });
    } else {
      activity.dailyCallTime += callDuration * 60;
      await activity.save();
    }

    res.json({ message: "Call time updated", activity });
  } catch (error) {
    res.status(500).json({ message: "Error updating call time", error });
  }
};

// ✅ Get Admin Dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    const { ExecutiveActivity } = req.db;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const executives = await ExecutiveActivity.findAll({
      where: { updatedAt: { [Op.gte]: todayStart } },
      order: [["updatedAt", "DESC"]],
    });

    res.json({ executives });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching admin dashboard data", error });
  }
};

exports.getAttendanceByDateRange = async (req, res) => {
  const { ExecutiveActivity, Users } = req.db;

  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "startDate and endDate query params are required (YYYY-MM-DD)",
      });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // ✅ Step 1: Fetch all non-admin executives
    const allExecutives = await Users.findAll({
      where: {
        role: {
          [Op.ne]: "Admin", // Exclude Admin
        },
      },
      attributes: ["id", "username"],
    });

    // ✅ Step 2: Get activity logs within the date range
    const logs = await ExecutiveActivity.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
      },
    });

    // ✅ Step 3: Map logs by ExecutiveId and date
    const logsMap = {};
    logs.forEach((log) => {
      const date = format(new Date(log.createdAt), "yyyy-MM-dd");
      if (!logsMap[log.ExecutiveId]) {
        logsMap[log.ExecutiveId] = {};
      }
      logsMap[log.ExecutiveId][date] = log;
    });

    // ✅ Step 4: Create date range
    const dateList = eachDayOfInterval({ start, end }).map((date) =>
      format(date, "yyyy-MM-dd")
    );

    // ✅ Step 5: Build attendance report
    const report = allExecutives.map(({ id, username }) => {
      const attendance = {};

      dateList.forEach((date) => {
        const log = logsMap[id]?.[date];
        attendance[date] = !log || log.workTime === null ? "Absent" : "Present";
      });

      return {
        executiveId: id,
        executiveName: username,
        dateRange: `${format(start, "yyyy-MM-dd")} to ${format(
          end,
          "yyyy-MM-dd"
        )}`,
        attendance,
      };
    });

    res.json(report);
  } catch (error) {
    console.error("❌ Error generating attendance report:", error);
    res.status(500).json({ error: "Failed to generate attendance report" });
  }
};

exports.getExecutiveActivityByExecutiveId = async (req, res) => {
  const { executiveId } = req.params;
  const { ExecutiveActivity } = req.db;

  try {
    const activities = await ExecutiveActivity.findAll({
      where: { ExecutiveId: executiveId },
      order: [["activityDate", "DESC"]], // optional: sort by recent first
    });

    if (!activities || activities.length === 0) {
      return res
        .status(404)
        .json({ message: "No activities found for this Executive ID" });
    }

    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching executive activities:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching executive activities" });
  }
};

exports.getAllExecutiveActivitiesByDate = async (req, res) => {
  const Activity = req.db.ExecutiveActivity; // or whatever your model name is

  try {
    // Fetch all activity records
    const activities = await Activity.findAll();

    // Group by activityDate
    const groupedData = activities.reduce((acc, item) => {
      const date = item.activityDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {});

    res.status(200).json(groupedData);
  } catch (error) {
    console.error("Error fetching activity data:", error);
    res.status(500).json({ error: "Failed to fetch activity data." });
  }
};
// ✅ NEW: Get Executive Summary by Date Range
exports.getExecutiveSummaryByRange = async (req, res) => {
  const { ExecutiveActivity } = req.db;
  const { executiveId } = req.params;
  const { startDate, endDate } = req.query;

  if (!executiveId || !startDate || !endDate) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const data = await ExecutiveActivity.findAll({
      where: {
        ExecutiveId: executiveId,
        activityDate: { [Op.between]: [startDate, endDate] },
      },
      order: [["activityDate", "ASC"]],
    });

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching summary:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//Get attendance as well as leave
exports.getAttendanceByDateRangeIncludingLeave = async (req, res) => {
  const { ExecutiveActivity, Users, LeaveApplication } = req.db;

  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "startDate and endDate query params are required (YYYY-MM-DD)",
      });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Step 1: Fetch all non-admin executives
    const allExecutives = await Users.findAll({
      where: {
        role: {
          [Op.ne]: "Admin",
        },
      },
      attributes: ["id", "username"],
    });

    // Step 2: Get all executive activity logs in date range
    const logs = await ExecutiveActivity.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
      },
    });

    // Step 3: Get all approved leaves in the range
    const leaves = await LeaveApplication.findAll({
      where: {
        status: "Approved",
        [Op.or]: [
          {
            startDate: {
              [Op.between]: [start, end],
            },
          },
          {
            endDate: {
              [Op.between]: [start, end],
            },
          },
          {
            startDate: {
              [Op.lte]: start,
            },
            endDate: {
              [Op.gte]: end,
            },
          },
        ],
      },
    });

    // Step 4: Organize logs and leaves
    const logsMap = {};
    logs.forEach((log) => {
      const date = format(new Date(log.createdAt), "yyyy-MM-dd");
      if (!logsMap[log.ExecutiveId]) logsMap[log.ExecutiveId] = {};
      logsMap[log.ExecutiveId][date] = log;
    });

    const leavesMap = {};
    leaves.forEach((leave) => {
      if (!leavesMap[leave.employeeId]) leavesMap[leave.employeeId] = [];
      leavesMap[leave.employeeId].push({
        startDate: leave.startDate,
        endDate: leave.endDate,
      });
    });

    // Step 5: Create date list
    const dateList = eachDayOfInterval({ start, end }).map((d) =>
      format(d, "yyyy-MM-dd")
    );

    // Step 6: Build attendance report
    const report = allExecutives.map(({ id, username }) => {
      const attendance = {};

      dateList.forEach((date) => {
        const isLeave = (leavesMap[id] || []).some((leave) =>
          isWithinInterval(new Date(date), {
            start: new Date(leave.startDate),
            end: new Date(leave.endDate),
          })
        );

        if (isLeave) {
          attendance[date] = "On Leave";
        } else {
          const log = logsMap[id]?.[date];
          attendance[date] =
            !log || log.workTime === null ? "Absent" : "Present";
        }
      });

      return {
        executiveId: id,
        executiveName: username,
        dateRange: `${format(start, "yyyy-MM-dd")} to ${format(
          end,
          "yyyy-MM-dd"
        )}`,
        attendance,
      };
    });

    res.json(report);
  } catch (error) {
    console.error("❌ Error generating attendance report:", error);
    res.status(500).json({ error: "Failed to generate attendance report" });
  }
};
