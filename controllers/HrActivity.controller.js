const { parseISO, format, eachDayOfInterval } = require("date-fns");
const { Op } = require("sequelize");
const getTodayDate = () => new Date().toISOString().split("T")[0];

exports.startWork = async (req, res) => {
  try {
    const { hr_id } = req.body;
    const { HrActivity } = req.db;
    const today = getTodayDate();

    if (!hr_id) {
      return res.status(400).json({ message: "hr_id is required" });
    }

    let activity = await HrActivity.findOne({
      where: { hr_id, activityDate: today },
    });

    if (!activity) {
      activity = await HrActivity.create({
        hr_id,
        activityDate: today,
        workStartTime: new Date(),
      });
    } else if (!activity.workStartTime) {
      activity.workStartTime = new Date();
      await activity.save();
    }

    res.status(200).json({ message: "Work started", activity });
  } catch (error) {
    console.error("Start Work Error:", error);
    res.status(500).json({ message: "Error starting work session" });
  }
};

exports.stopWork = async (req, res) => {
  try {
    const { hr_id } = req.body;
    const { HrActivity } = req.db;
    const today = getTodayDate();

    if (!hr_id) {
      return res.status(400).json({ message: "hr_id is required" });
    }

    const activity = await HrActivity.findOne({
      where: { hr_id, activityDate: today },
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

    res.status(200).json({ message: "Work stopped", duration, activity });
  } catch (error) {
    console.error("Stop Work Error:", error);
    res.status(500).json({ message: "Error stopping work session" });
  }
};

exports.startBreak = async (req, res) => {
  try {
    const { hr_id } = req.body;
    const { HrActivity } = req.db;
    const today = getTodayDate();

    if (!hr_id) {
      return res.status(400).json({ message: "hr_id is required" });
    }

    const activity = await HrActivity.findOne({
      where: { hr_id, activityDate: today },
    });

    if (!activity) {
      return res.status(404).json({ message: "No activity found for today" });
    }

    activity.breakStartTime = new Date();
    await activity.save();

    res.status(200).json({ message: "Break started", activity });
  } catch (error) {
    console.error("Start Break Error:", error);
    res.status(500).json({ message: "Error starting break" });
  }
};

exports.stopBreak = async (req, res) => {
  try {
    const { hr_id } = req.body;
    const { HrActivity } = req.db;
    const today = getTodayDate();

    if (!hr_id) {
      return res.status(400).json({ message: "hr_id is required" });
    }

    const activity = await HrActivity.findOne({
      where: { hr_id, activityDate: today },
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
  } catch (error) {
    console.error("Stop Break Error:", error);
    res.status(500).json({ message: "Error stopping break" });
  }
};

exports.getHrAttendanceByDateRange = async (req, res) => {
  const { HrActivity, Hr } = req.db;

  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "startDate and endDate query params are required (YYYY-MM-DD)",
      });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Step 1: Get all HRs with their names
    const hrIds = await HrActivity.findAll({
      attributes: ["hr_id"],
      include: [
        {
          model: Hr,
          as: "hr",
          attributes: ["name"],
        },
      ],
      group: ["hr_id", "hr.id"],
    });

    const allHrs = hrIds.map((entry) => ({
      id: entry.hr_id,
      name: entry.hr?.name || "Unknown",
    }));

    // Step 2: Fetch activity logs for the given date range
    const logs = await HrActivity.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
      },
    });

    // Step 3: Group logs by hr_id and date
    const logsMap = {};
    logs.forEach((log) => {
      const date = format(new Date(log.createdAt), "yyyy-MM-dd");
      if (!logsMap[log.hr_id]) {
        logsMap[log.hr_id] = {};
      }
      logsMap[log.hr_id][date] = log;
    });

    // Step 4: Generate list of all dates in range
    const dateList = eachDayOfInterval({ start, end }).map((date) =>
      format(date, "yyyy-MM-dd")
    );

    // Step 5: Build report
    const report = allHrs.map(({ id, name }) => {
      const attendance = {};

      dateList.forEach((date) => {
        const log = logsMap[id]?.[date];
        attendance[date] = !log || log.workTime === null ? "Absent" : "Present";
      });

      return {
        hrId: id,
        hrName: name,
        dateRange: `${format(start, "yyyy-MM-dd")} to ${format(
          end,
          "yyyy-MM-dd"
        )}`,
        attendance,
      };
    });

    res.json(report);
  } catch (error) {
    console.error("Error generating HR attendance:", error);
    res.status(500).json({ error: "Failed to generate HR attendance report" });
  }
};
