// const nodemailer = require("nodemailer");
// const cron = require("node-cron");

// exports.scheduleEodReport = async (req, res) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS, // App password (keep secret)
//       },
//     });

//     const mailOptions = {
//       from: "mathurchetanya1@gmail.com",
//       to: email,
//       subject: "EOD Report from AtoZee Visas",
//       html: `
//         <h3>EOD Report</h3>
//         <pre style="font-family: monospace; white-space: pre-wrap;">${content}</pre>
//       `,
//     };
//     console.log("📧 Sending email to:", email);
//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.log("❌ Error sending email:", error);
//         return res.status(500).json({ status: 500, error: error.message });
//       } else {
//         console.log("✅ Email sent:", info.response);
//         return res.status(201).json({ message: "Email sent successfully" });
//       }
//     });
//     const {
//       executiveId,
//       executiveName,
//       email,
//       fields,
//       startDate,
//       endDate,
//       time,
//     } = req.body;

//     if (
//       !executiveId ||
//       !executiveName ||
//       !email ||
//       !Array.isArray(fields) ||
//       !startDate ||
//       !endDate ||
//       !time
//     ) {
//       return res.status(400).json({ message: "Missing required fields." });
//     }

//     const [hour, minute] = time.split(":").map(Number);
//     if (isNaN(hour) || isNaN(minute)) {
//       return res.status(400).json({ message: "Invalid time format." });
//     }

//     const { ExecutiveActivity, Meeting } = req.db;

//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     const cronExpression = `${minute} ${hour} * * *`;

//     cron.schedule(cronExpression, async () => {
//       try {
//         const today = new Date();
//         const todayDateOnly = today.toISOString().split("T")[0];
//         const current = new Date(todayDateOnly);

//         if (current < start || current > end) {
//           console.log(
//             `Skipped report: ${todayDateOnly} is outside the selected range.`
//           );
//           return;
//         }

//         let freshReportData = {};

//         // Fetch activity for today
//         if (
//           fields.includes("leadVisits") ||
//           fields.includes("executiveActivity")
//         ) {
//           const activities = await ExecutiveActivity.findAll({
//             where: {
//               ExecutiveId: executiveId,
//               activityDate: todayDateOnly,
//             },
//           });

//           if (activities.length > 0) {
//             let totalLeadVisits = 0;
//             let totalWorkTime = 0;
//             let totalBreakTime = 0;
//             let totalCallTime = 0;

//             activities.forEach((activity) => {
//               if (fields.includes("leadVisits")) {
//                 totalLeadVisits += activity.leadSectionVisits || 0;
//               }
//               if (fields.includes("executiveActivity")) {
//                 totalWorkTime += activity.workTime || 0;
//                 totalBreakTime += activity.breakTime || 0;
//                 totalCallTime += activity.dailyCallTime || 0;
//               }
//             });

//             if (fields.includes("leadVisits")) {
//               freshReportData.leadVisits = totalLeadVisits;
//             }

//             if (fields.includes("executiveActivity")) {
//               freshReportData.executiveActivity = {
//                 workTime: totalWorkTime,
//                 breakTime: totalBreakTime,
//                 dailyCallTime: totalCallTime,
//               };
//             }
//           } else {
//             freshReportData.activityMessage =
//               "No activity data found for today.";
//           }
//         }

//         // Fetch all-time meeting count
//         if (fields.includes("meeting")) {
//           const meetingCount = await Meeting.count({
//             where: { executiveId },
//           });
//           freshReportData.meetingCount = meetingCount;
//         }

//         const emailContent = formatReport(freshReportData, executiveName);

//         const transporter = nodemailer.createTransport({
//           service: "gmail",
//           auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS,
//           },
//         });

//         await transporter.sendMail({
//           from: process.env.EMAIL_USER,
//           to: email,
//           subject: `Executive Report for ${executiveName} on ${todayDateOnly}`,
//           html: emailContent,
//         });

//         console.log(`Report sent to ${email} for ${todayDateOnly}`);
//       } catch (error) {
//         console.error("Error sending daily executive report:", error);
//       }
//     });

//     return res.status(200).json({
//       message: "Daily report scheduled successfully between given date range.",
//     });
//   } catch (error) {
//     console.error("Error scheduling executive report:", error);
//     return res.status(500).json({ message: "Failed to schedule report." });
//   }
// };

// // Format email HTML
// function formatReport(data, executiveName) {
//   let html = `<h2>Executive Report for ${executiveName}</h2>
//          <h3>Executive Activity summary for today</h3><ul>`;

//   const formatDuration = (seconds) => {
//     const hrs = Math.floor(seconds / 3600);
//     const mins = Math.floor((seconds % 3600) / 60);
//     return `${hrs}h ${mins}m`;
//   };

//   if ("leadVisits" in data) {
//     html += `<li><strong>Lead Section Visits:</strong> ${data.leadVisits}</li>`;
//   }

//   if ("executiveActivity" in data) {
//     const { workTime, breakTime, dailyCallTime } = data.executiveActivity;
//     html += `<li><strong>Work Time:</strong> ${formatDuration(workTime)}</li>`;
//     html += `<li><strong>Break Time:</strong> ${formatDuration(
//       breakTime
//     )}</li>`;
//     html += `<li><strong>Daily Call Time:</strong> ${formatDuration(
//       dailyCallTime
//     )}</li>`;
//   }

//   if ("meetingCount" in data) {
//     html += `<li><strong>Total Meetings Scheduled:</strong> ${data.meetingCount}</li>`;
//   }

//   if (data.activityMessage) {
//     html += `<li><i>${data.activityMessage}</i></li>`;
//   }

//   html += `</ul>`;
//   return html;
// }

const nodemailer = require("nodemailer");
const cron = require("node-cron");

exports.scheduleEodReport = async (req, res) => {
  try {
    const {
      executiveId,
      executiveName,
      email,
      fields,
      startDate,
      endDate,
      time,
    } = req.body;

    if (
      !executiveId ||
      !email ||
      !Array.isArray(fields) ||
      !startDate ||
      !endDate ||
      !time
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const [hour, minute] = time.split(":").map(Number);

    if (
      isNaN(start.getTime()) ||
      isNaN(end.getTime()) ||
      isNaN(hour) ||
      isNaN(minute)
    ) {
      return res.status(400).json({ message: "Invalid date or time format." });
    }

    const { ExecutiveActivity, Sequelize, Meeting } = req.db;

    const cronExpression = `${minute} ${hour} * * *`;

    cron.schedule(cronExpression, async () => {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];

      if (todayStr < startStr || todayStr > endStr) {
        console.log(
          `⏭️ Skipping report for ${todayStr} (outside selected range).`
        );
        return;
      }

      let reportData = {};

      const activities = await ExecutiveActivity.findAll({
        where: {
          ExecutiveId: executiveId,
          activityDate: todayStr,
        },
      });

      if (activities.length > 0) {
        let totalLeadVisits = 0;
        let totalWorkTime = 0;
        let totalBreakTime = 0;
        let totalCallTime = 0;

        activities.forEach((activity) => {
          if (fields.includes("leadVisits")) {
            totalLeadVisits += activity.leadSectionVisits || 0;
          }

          if (fields.includes("executiveActivity")) {
            totalWorkTime += activity.workTime || 0;
            totalBreakTime += activity.breakTime || 0;
            totalCallTime += activity.dailyCallTime || 0;
          }
        });

        if (fields.includes("leadVisits")) {
          reportData.leadVisits = totalLeadVisits;
        }

        if (fields.includes("executiveActivity")) {
          reportData.executiveActivity = {
            workTime: totalWorkTime,
            breakTime: totalBreakTime,
            dailyCallTime: totalCallTime,
          };
        }
      } else {
        reportData.activityMessage = "No activity data found for today.";
      }

      if (fields.includes("meeting")) {
        const meetingCount = await Meeting.count({
          where: { executiveId },
        });

        reportData.meetingCount = meetingCount;
      }

      const emailContent = formatReportHTML(reportData, executiveName, time);

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
        subject: "EOD Report",
        html: emailContent,
      });

      console.log(`📨 Report sent to ${email} on ${todayStr}`);
    });

    return res.status(200).json({
      message: "Report scheduled successfully.",
    });
  } catch (error) {
    console.error("Error scheduling executive report:", error);
    return res.status(500).json({ message: "Failed to schedule report." });
  }
};

// Helper to format durations and report into HTML
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

function formatReportHTML(data, executiveName, time) {
  let html = `
    <h4>📋 EOD Report for ${executiveName}</h4>
    <p><strong>Time:</strong> ${time}</p>
    <ul style="list-style: none; padding-left: 0;">
  `;

  if ("leadVisits" in data) {
    html += `<li>🔹 Lead Visit: Visited ${data.leadVisits} potential leads today.</li>`;
  }

  if ("executiveActivity" in data) {
    const { workTime, breakTime, dailyCallTime } = data.executiveActivity;
    html += `<li>🔹 Executive Activity: Work Time: ${formatDuration(
      workTime
    )}, Break Time: ${formatDuration(breakTime)}, Call Time: ${formatDuration(
      dailyCallTime
    )}.</li>`;
  }

  html += `<li>🔹 Profit: Calculated daily profit: $0.</li>`;

  if ("meetingCount" in data) {
    html += `<li>🔹 Meeting: Total meetings conducted/scheduled: ${data.meetingCount}</li>`;
  }

  if (data.activityMessage) {
    html += `<li><em>${data.activityMessage}</em></li>`;
  }

  html += `</ul>`;
  return html;
}
