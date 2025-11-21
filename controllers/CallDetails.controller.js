const { Op } = require("sequelize");
const moment = require("moment");
const { get } = require("../routes/ExecutiveActivity.routes");
// 🔽 Already existing function
const saveCallDetails = async (req, res) => {
  try {
    const {
      executiveId,
      clientName,
      clientPhone,
      recordingPath,
      callStartTime,
      callEndTime,
      duration,
    } = req.body;

    console.log("📥 Incoming Call Metadata:", {
      executiveId,
      clientName,
      clientPhone,
      recordingPath,
      callStartTime,
      callEndTime,
      duration,
    });

    const missingFields = [];
    if (!executiveId) missingFields.push("executiveId");
    if (!clientName) missingFields.push("clientName");
    if (!clientPhone) missingFields.push("clientPhone");
    if (!recordingPath) missingFields.push("recordingPath");
    if (!callStartTime) missingFields.push("callStartTime");
    if (!callEndTime) missingFields.push("callEndTime");
    if (!duration) missingFields.push("duration");

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        missingFields,
      });
    }

    const db = req.db;
    if (!db || !db.CallDetails) {
      console.error("❌ CallDetails model not found in req.db");
      return res.status(500).json({
        error: "CallDetails model not available in tenant DB",
      });
    }

    console.log("✅ CallDetails model available. Saving to DB...");

    const newCall = await db.CallDetails.create({
      executiveId,
      clientName,
      clientPhone,
      recordingPath,
      startTime: callStartTime,
      endTime: callEndTime,
      durationSeconds: parseInt(duration, 10),
    });

    console.log("✅ Saved call to DB:", newCall?.id || "No ID returned");

    return res.status(201).json({
      message: "✅ Call details saved successfully",
      data: newCall,
    });
  } catch (error) {
    console.error("🔥 Error in saveCallDetails:", error.message);
    console.error("🧠 Stack trace:", error.stack);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
// 🔼 New function: getWeeklyCallDurations
const getWeeklyCallDurations = async (req, res) => {
  try {
    const { executiveId } = req.params;
    const db = req.db;

    if (!db || !db.CallDetails) {
      console.error("❌ CallDetails model not found in req.db");
      return res.status(500).json({ error: "Model not found in tenant DB" });
    }

    const startOfWeek = moment().startOf("isoWeek").toDate(); // Monday
    const endOfWeek = moment().endOf("isoWeek").toDate();     // Sunday

    const calls = await db.CallDetails.findAll({
      where: {
        executiveId,
        startTime: { [Op.between]: [startOfWeek, endOfWeek] },
        durationSeconds: { [Op.gt]: 0 },
      },
    });

    const dailyTotals = [0, 0, 0, 0, 0, 0, 0]; // Mon–Sun
    calls.forEach(call => {
      const dayIndex = moment(call.startTime).isoWeekday() - 1;
      dailyTotals[dayIndex] += call.durationSeconds;
    });

    const weeklyData = dailyTotals.map(sec => Math.floor(sec / 60)); // in minutes
    return res.json({ weeklyData });
  } catch (err) {
    console.error("🔥 Error in getWeeklyCallDurations:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getCallTimeByDateRange = async (req, res) => {
  try {
    const executiveId = parseInt(req.params.executiveId);
    const { startDate, endDate } = req.query;

    if (!executiveId || !startDate || !endDate) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["executiveId", "startDate", "endDate"],
      });
    }

    const db = req.db;
    if (!db || !db.CallDetails) {
      return res.status(500).json({ error: "CallDetails model not found" });
    }

    const startTime = moment(`${startDate} 00:00:00`).toDate();
    const endTime = moment(`${endDate} 23:59:59`).toDate();

    const calls = await db.CallDetails.findAll({
      where: {
        executiveId,
        startTime: {
          [Op.between]: [startTime, endTime],
        },
        durationSeconds: { [Op.gt]: 0 },
      },
    });

    const totalSeconds = calls.reduce(
      (sum, call) => sum + (call.durationSeconds || 0),
      0
    );

    return res.status(200).json({
      executiveId,
      startDate,
      endDate,
      totalCallTimeSeconds: totalSeconds,
      totalCallTimeMinutes: +(totalSeconds / 60).toFixed(2),
      totalCallTimeHours: +(totalSeconds / 3600).toFixed(2),
    });
  } catch (err) {
    console.error("🔥 Error in getCallTimeByDateRange:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// /api/call-durations-grouped/:executiveId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
const getCallDurationsGroupedByDay = async (req, res) => {
  try {
    const executiveId = parseInt(req.params.executiveId);
    const { startDate, endDate } = req.query;
    const db = req.db;

    const startTime = moment(`${startDate} 00:00:00`).toDate();
    const endTime = moment(`${endDate} 23:59:59`).toDate();

    const calls = await db.CallDetails.findAll({
      where: {
        executiveId,
        startTime: {
          [Op.between]: [startTime, endTime],
        },
        durationSeconds: { [Op.gt]: 0 },
      },
    });

    const dailyMap = {};

    calls.forEach(call => {
      const day = moment(call.startTime).format("YYYY-MM-DD");
      dailyMap[day] = (dailyMap[day] || 0) + call.durationSeconds;
    });

    return res.json({
      executiveId,
      groupedByDate: Object.entries(dailyMap).reduce((acc, [date, secs]) => {
        acc[date] = +(secs / 60).toFixed(2);
        return acc;
      }, {}),
    });
  } catch (err) {
    console.error("🔥 Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports = {
  saveCallDetails,
  getWeeklyCallDurations,
  getCallTimeByDateRange,
  getCallDurationsGroupedByDay,
};
