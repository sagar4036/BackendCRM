const moment = require("moment-timezone");

const scheduleFollowUpNotification = async (req, res) => {
  try {
    const {
      userId,
      clientName,
      date,
      time,
      targetRole = "executive",
    } = req.body;
    const FollowupNotification = req.db.FollowupNotification;

    if (!FollowupNotification) {
      console.log("❌ FollowupNotification model not available in req.db");
      return res.status(500).json({ message: "Model not found in tenant DB" });
    }

    if (!userId || !clientName || !date || !time) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const combined = `${date} ${time}`;
    const istDateTime = moment.tz(
      combined,
      "YYYY-MM-DD HH:mm:ss",
      "Asia/Kolkata"
    );

    if (!istDateTime.isValid()) {
      return res.status(400).json({ message: "Invalid date/time format." });
    }

    // ✅ Subtract 2 minutes in IST
    const reminderTime = istDateTime.clone().subtract(2, "minutes").toDate();

    const formattedTime = istDateTime.format("hh.mm A");
    const message = `Reminder: Follow up with ${clientName} scheduled on ${date} at ${formattedTime}.`;

    const scheduled = await FollowupNotification.create({
      userId,
      message,
      remindAt: reminderTime,
      targetRole,
    });

    return res.status(201).json({
      message: "Follow-up notification scheduled.",
      scheduled,
    });
  } catch (error) {
    console.error("❌ Error scheduling notification:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { scheduleFollowUpNotification };
