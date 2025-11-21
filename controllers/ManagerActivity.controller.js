const { parseISO, format, eachDayOfInterval } = require("date-fns");
const { Op } = require("sequelize");

const getTodayDate = () => new Date().toISOString().split("T")[0];

exports.startWork = async (req, res) => {
  try {
    const { manager_id } = req.body;
    const { ManagerActivity } = req.db;
    const today = getTodayDate();

    if (!manager_id) {
      return res.status(400).json({ message: "manager_id is required" });
    }

    let activity = await ManagerActivity.findOne({
      where: { manager_id, activityDate: today },
    });

    if (!activity) {
      activity = await ManagerActivity.create({
        manager_id,
        activityDate: today,
        workStartTime: new Date(),
      });
    } else if (!activity.workStartTime) {
      activity.workStartTime = new Date();
      await activity.save();
    }

    res.status(200).json({ message: "Work started", activity });
  } catch (err) {
    console.error("Start Work Error:", err);
    res.status(500).json({ message: "Error starting work session" });
  }
};

exports.stopWork = async (req, res) => {
  try {
    const { manager_id } = req.body;
    const { ManagerActivity } = req.db;
    const today = getTodayDate();

    if (!manager_id) {
      return res.status(400).json({ message: "manager_id is required" });
    }

    const activity = await ManagerActivity.findOne({
      where: { manager_id, activityDate: today },
    });

    if (!activity || !activity.workStartTime) {
      return res.status(400).json({ message: "Work session not started" });
    }

    const duration = Math.floor(
      (new Date() - new Date(activity.workStartTime)) / 1000
    );

    activity.workTime += duration;
    activity.workStartTime = null;
    await activity.save();

    res
      .status(200)
      .json({ message: "Work session stopped", duration, activity });
  } catch (err) {
    console.error("Stop Work Error:", err);
    res.status(500).json({ message: "Error stopping work session" });
  }
};

exports.startBreak = async (req, res) => {
  try {
    const { manager_id } = req.body;
    const { ManagerActivity } = req.db;
    const today = getTodayDate();

    if (!manager_id) {
      return res.status(400).json({ message: "manager_id is required" });
    }

    const activity = await ManagerActivity.findOne({
      where: { manager_id, activityDate: today },
    });

    if (!activity) {
      return res.status(404).json({ message: "No activity found for today" });
    }

    activity.breakStartTime = new Date();
    await activity.save();

    res.status(200).json({ message: "Break started", activity });
  } catch (err) {
    console.error("Start Break Error:", err);
    res.status(500).json({ message: "Error starting break" });
  }
};

exports.stopBreak = async (req, res) => {
  try {
    const { manager_id } = req.body;
    const { ManagerActivity } = req.db;
    const today = getTodayDate();

    if (!manager_id) {
      return res.status(400).json({ message: "manager_id is required" });
    }

    const activity = await ManagerActivity.findOne({
      where: { manager_id, activityDate: today },
    });

    if (!activity || !activity.breakStartTime) {
      return res.status(400).json({ message: "Break not started" });
    }

    const duration = Math.floor(
      (new Date() - new Date(activity.breakStartTime)) / 1000
    );

    activity.breakTime += duration;
    activity.breakStartTime = null;
    await activity.save();

    res.status(200).json({ message: "Break stopped", duration, activity });
  } catch (err) {
    console.error("Stop Break Error:", err);
    res.status(500).json({ message: "Error stopping break" });
  }
};

exports.getManagerAttendanceByDateRange = async (req, res) => {
  const { ManagerActivity, Manager } = req.db;

  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "startDate and endDate query params are required (YYYY-MM-DD)",
      });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Step 1: Get all unique manager IDs with their names
    const managerIds = await ManagerActivity.findAll({
      attributes: ["manager_id"],
      include: [
        {
          model: Manager,
          as: "manager",
          attributes: ["name"],
        },
      ],
      group: ["manager_id", "manager.id"],
    });

    const allManagers = managerIds.map((entry) => ({
      id: entry.manager_id,
      name: entry.manager?.name || "Unknown",
    }));

    // Step 2: Get logs within the date range
    const logs = await ManagerActivity.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
      },
    });

    // Step 3: Organize logs by manager and date
    const logsMap = {};
    logs.forEach((log) => {
      const date = format(new Date(log.createdAt), "yyyy-MM-dd");
      if (!logsMap[log.manager_id]) {
        logsMap[log.manager_id] = {};
      }
      logsMap[log.manager_id][date] = log;
    });

    // Step 4: Generate list of dates in range
    const dateList = eachDayOfInterval({ start, end }).map((date) =>
      format(date, "yyyy-MM-dd")
    );

    // Step 5: Build attendance report
    const report = allManagers.map(({ id, name }) => {
      const attendance = {};

      dateList.forEach((date) => {
        const log = logsMap[id]?.[date];
        attendance[date] = !log || log.workTime === null ? "Absent" : "Present";
      });

      return {
        managerId: id,
        managerName: name,
        dateRange: `${format(start, "yyyy-MM-dd")} to ${format(
          end,
          "yyyy-MM-dd"
        )}`,
        attendance,
      };
    });

    res.json(report);
  } catch (error) {
    console.error("Error generating manager attendance:", error);
    res
      .status(500)
      .json({ error: "Failed to generate manager attendance report" });
  }
};
