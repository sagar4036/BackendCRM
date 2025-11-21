const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
require("dotenv").config();

exports.getEodReport = async (req, res) => {
  try {
    const { ExecutiveId } = req.body;
    const { ExecutiveActivity, Meeting } = req.db;

    if (!ExecutiveId)
      return res.status(400).json({ message: "ExecutiveId is required" });

    // Define today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch Executive Activity
    const activity = await ExecutiveActivity.findOne({
      where: {
        ExecutiveId,
        createdAt: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
    });

    // Fetch Meetings for the executive
    const meetings = await Meeting.findAll({
      where: {
        executiveId: ExecutiveId,
        startTime: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
    });

    const meetingDetails = meetings.map((meeting) => ({
      clientName: meeting.clientName,
      clientEmail: meeting.clientEmail,
      clientPhone: meeting.clientPhone,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      reasonForFollowup: meeting.reasonForFollowup,
    }));

    const report = {
      ExecutiveId,
      workTime: activity?.workTime ?? 0,
      breakTime: activity?.breakTime ?? 0,
      dailyCallTime: activity?.dailyCallTime ?? 0,
      leadSectionVisits: activity?.leadSectionVisits ?? 0,
      meetingCount: meetings.length,
      meetings: meetingDetails,
    };

    return res.status(200).json({ message: "EOD Report generated", report });
  } catch (error) {
    console.error("EOD report generation failed:", error);
    return res
      .status(500)
      .json({ message: "Failed to generate EOD report", error });
  }
};

exports.scheduleEodReport = async (req, res) => {
  try {
    const { executiveId, email, fields } = req.body;

    if (!executiveId || !email || !Array.isArray(fields)) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const { ExecutiveActivity, Meeting } = req.db;

    // Fetch executive activity for today (or adjust range as needed)
    const today = new Date().toISOString().split("T")[0];

    let reportData = {};

    if (fields.includes("leadVisits") || fields.includes("executiveActivity")) {
      const activity = await ExecutiveActivity.findOne({
        where: { ExecutiveId: executiveId, activityDate: today },
      });

      if (activity) {
        if (fields.includes("leadVisits")) {
          reportData.leadVisits = activity.leadSectionVisits;
        }

        if (fields.includes("executiveActivity")) {
          reportData.executiveActivity = {
            workTime: activity.workTime,
            breakTime: activity.breakTime,
            dailyCallTime: activity.dailyCallTime,
          };
        }
      } else {
        reportData.activityMessage = "No activity data found for today.";
      }
    }

    if (fields.includes("meeting")) {
      const meetingCount = await Meeting.count({
        where: { executiveId },
      });

      reportData.meetingCount = meetingCount;
    }

    // Format report into plain text or HTML
    const emailContent = formatReport(reportData);

    // Send email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Executive Report",
      html: emailContent,
    });

    return res
      .status(200)
      .json({ message: "Report sent successfully.", reportData });
  } catch (error) {
    console.error("Error sending executive report:", error);
    return res.status(500).json({ message: "Failed to send report." });
  }
};

// Helper to format report into HTML
function formatReport(data) {
  let html = `<h2>Executive Report</h2><ul>`;

  if ("leadVisits" in data) {
    html += `<li><strong>Lead Section Visits:</strong> ${data.leadVisits}</li>`;
  }

  if ("executiveActivity" in data) {
    const { workTime, breakTime, dailyCallTime } = data.executiveActivity;
    html += `<li><strong>Work Time:</strong> ${workTime} minutes</li>`;
    html += `<li><strong>Break Time:</strong> ${breakTime} minutes</li>`;
    html += `<li><strong>Daily Call Time:</strong> ${dailyCallTime} minutes</li>`;
  }

  if ("meetingCount" in data) {
    html += `<li><strong>Meetings Scheduled:</strong> ${data.meetingCount}</li>`;
  }

  if (data.activityMessage) {
    html += `<li><i>${data.activityMessage}</i></li>`;
  }

  html += `</ul>`;
  return html;
}
