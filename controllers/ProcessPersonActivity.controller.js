const { parseISO, format, eachDayOfInterval } = require("date-fns");
const { Op } = require("sequelize");
const getTodayDate = () => new Date().toISOString().split("T")[0];

exports.startWork = async (req, res) => {
  try {
    const { process_person_id } = req.body;
    const { ProcessPersonActivity } = req.db;
    const today = getTodayDate();

    if (!process_person_id)
      return res.status(400).json({ message: "process_person_id is required" });

    let activity = await ProcessPersonActivity.findOne({
      where: { process_person_id, activityDate: today },
    });

    if (!activity) {
      activity = await ProcessPersonActivity.create({
        process_person_id,
        activityDate: today,
        workStartTime: new Date(),
        workTime: 0,
        breakTime: 0,
      });
    } else if (!activity.workStartTime) {
      activity.workStartTime = new Date();
      await activity.save();
    }

    res.json({ message: "Work session started", activity });
  } catch (error) {
    console.error("Start work error:", error);
    res.status(500).json({ message: "Error starting work session", error });
  }
};

exports.stopWork = async (req, res) => {
  try {
    const { process_person_id } = req.body;
    const { ProcessPersonActivity } = req.db;
    const today = getTodayDate();

    if (!process_person_id)
      return res.status(400).json({ message: "process_person_id is required" });

    const activity = await ProcessPersonActivity.findOne({
      where: { process_person_id, activityDate: today },
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
    console.error("Stop work error:", error);
    res.status(500).json({ message: "Error stopping work session", error });
  }
};

exports.startBreak = async (req, res) => {
  try {
    const { process_person_id } = req.body;
    const { ProcessPersonActivity } = req.db;
    const today = getTodayDate();

    if (!process_person_id)
      return res.status(400).json({ message: "process_person_id is required" });

    const activity = await ProcessPersonActivity.findOne({
      where: { process_person_id, activityDate: today },
    });

    if (!activity)
      return res.status(400).json({ message: "No activity found for today" });

    activity.breakStartTime = new Date();
    await activity.save();

    res.json({ message: "Break started", activity });
  } catch (error) {
    console.error("Start break error:", error);
    res.status(500).json({ message: "Error starting break", error });
  }
};

exports.stopBreak = async (req, res) => {
  try {
    const { process_person_id } = req.body;
    const { ProcessPersonActivity } = req.db;
    const today = getTodayDate();

    if (!process_person_id)
      return res.status(400).json({ message: "process_person_id is required" });

    const activity = await ProcessPersonActivity.findOne({
      where: { process_person_id, activityDate: today },
    });

    if (!activity || !activity.breakStartTime)
      return res.status(400).json({ message: "Break not started" });

    const breakDuration = Math.floor(
      (new Date() - new Date(activity.breakStartTime)) / 1000
    );

    activity.breakTime += breakDuration;
    activity.breakStartTime = null;
    await activity.save();

    res.json({ message: "Break stopped", breakDuration, activity });
  } catch (error) {
    console.error("Stop break error:", error);
    res.status(500).json({ message: "Error stopping break", error });
  }
};

exports.getProcessPersonAttendanceByDateRange = async (req, res) => {
  const { ProcessPersonActivity, ProcessPerson } = req.db;

  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "startDate and endDate query params are required (YYYY-MM-DD)",
      });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Step 1: Get all ProcessPersons with their names
    const persons = await ProcessPersonActivity.findAll({
      attributes: ["process_person_id"],
      include: [
        {
          model: ProcessPerson,
          attributes: ["fullName"],
          as: "processPerson", // 👈 must match alias in association
        },
      ],
      group: ["process_person_id", "processPerson.id"],
    });

    const allPersons = persons.map((entry) => ({
      id: entry.process_person_id,
      name: entry.processPerson?.fullName || "Unknown",
    }));

    // Step 2: Fetch activity logs for the given date range
    const logs = await ProcessPersonActivity.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
      },
    });

    // Step 3: Group logs by process_person_id and date
    const logsMap = {};
    logs.forEach((log) => {
      const date = format(new Date(log.createdAt), "yyyy-MM-dd");
      if (!logsMap[log.process_person_id]) {
        logsMap[log.process_person_id] = {};
      }
      logsMap[log.process_person_id][date] = log;
    });

    // Step 4: Generate list of all dates in range
    const dateList = eachDayOfInterval({ start, end }).map((date) =>
      format(date, "yyyy-MM-dd")
    );

    // Step 5: Build report
    const report = allPersons.map(({ id, name }) => {
      const attendance = {};

      dateList.forEach((date) => {
        const log = logsMap[id]?.[date];
        attendance[date] = !log || log.workTime === null ? "Absent" : "Present";
      });

      return {
        processPersonId: id,
        fullName: name,
        dateRange: `${format(start, "yyyy-MM-dd")} to ${format(
          end,
          "yyyy-MM-dd"
        )}`,
        attendance,
      };
    });

    res.json(report);
  } catch (error) {
    console.error("Error generating Process Person attendance:", error);
    res
      .status(500)
      .json({ error: "Failed to generate Process Person attendance report" });
  }
};
