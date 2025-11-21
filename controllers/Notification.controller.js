const { Op, where } = require("sequelize");

// Get all notifications for a user (admin or executive) with pagination
// const getAllNotificationsByUser = async (req, res) => {
//   const Notification = req.db.Notification; // 👈 dynamically get model
//   const { userRole } = req.body;
//   const userId = req.user?.id;
//   const { page = 1 } = req.query;

//   const limit = 20;
//   const offset = (page - 1) * limit;

//   try {
//     let whereClause = {};

//     if (userRole?.toLowerCase() === "admin") {
//       whereClause = { targetRole: "admin" };
//     } else if (userRole?.toLowerCase() === "executive") {
//       if (!userId) {
//         return res
//           .status(401)
//           .json({ message: "Unauthorized: Missing user ID" });
//       }
//       whereClause = { userId, targetRole: "executive" };
//     } else {
//       return res.status(400).json({ message: "Invalid user role" });
//     }

//     const { count, rows: notifications } = await Notification.findAndCountAll({
//       where: whereClause,
//       order: [["createdAt", "DESC"]],
//       limit,
//       offset,
//     });

//     const totalPages = Math.ceil(count / limit);

//     return res.status(200).json({
//       notifications,
//       pagination: {
//         totalNotifications: count,
//         currentPage: parseInt(page),
//         totalPages,
//         limit,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching notifications:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

const getAllNotificationsByUser = async (req, res) => {
  const Notification = req.db.Notification;
  const { userRole } = req.body;
  const userId = req.user?.id;
  const { page = 1 } = req.query;

  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    let whereClause = {};

    switch (userRole?.toLowerCase()) {
      case "admin":
        whereClause = { targetRole: "admin" };
        break;

      case "executive":
        if (!userId) {
          return res
            .status(401)
            .json({ message: "Unauthorized: Missing executive user ID" });
        }
        whereClause = { userId, targetRole: "executive" };
        break;

      case "hr":
        if (!userId) {
          return res
            .status(401)
            .json({ message: "Unauthorized: Missing HR user ID" });
        }
        //whereClause = { hr_id: userId, targetRole: "hr" };
        whereClause = { targetRole: "hr" };
        break;

      case "customer":
        if (!userId) {
          return res
            .status(401)
            .json({ message: "Unauthorized: Missing customer user ID" });
        }
        whereClause = { customerId: userId, targetRole: "customer" };
        break;

      default:
        return res.status(400).json({ message: "Invalid user role" });
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      notifications,
      pagination: {
        totalNotifications: count,
        currentPage: parseInt(page),
        totalPages,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Other functions remain unchanged
const markAsRead = async (req, res) => {
  const Notification = req.db.Notification; // ✅ Dynamic DB
  const { id } = req.params;

  try {
    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.is_read = true;
    await notification.save();

    return res
      .status(200)
      .json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Error updating notification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const markMultipleAsRead = async (req, res) => {
  const Notification = req.db.Notification;
  const { notificationIds } = req.body;

  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return res
      .status(400)
      .json({ message: "Invalid or empty notificationIds array." });
  }

  try {
    const [updatedCount] = await Notification.update(
      { is_read: true },
      {
        where: {
          id: notificationIds,
          is_read: false,
        },
      }
    );

    return res.status(200).json({
      message: `Marked ${updatedCount} notifications as read.`,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteNotification = async (req, res) => {
  const Notification = req.db.Notification; // ✅ Dynamic DB
  const { id } = req.params;

  try {
    const deleted = await Notification.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const deleteOldNotifications = async (req, res) => {
  const Notification = req.db.Notification; // ✅ Dynamic DB
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  try {
    const deleted = await Notification.destroy({
      where: {
        createdAt: {
          [Op.lt]: threeMonthsAgo,
        },
      },
    });

    return res.status(200).json({
      message: `${deleted} old notification(s) deleted`,
    });
  } catch (error) {
    console.error("Error deleting old notifications:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const copyTextNotification = async (req, res) => {
  const Notification = req.db.Notification;
  const { userId, userRole, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({
      message: "userId and message are required",
    });
  }

  try {
    const notification = await Notification.create({
      userId,
      message,
      targetRole: "admin",
    });

    // ✅ Emit real-time notification to the target user if online
    if (global.connectedUsers && global.connectedUsers[userId]) {
      req.io.to(global.connectedUsers[userId]).emit("new_notification", {
        message,
        userId,
      });
      console.log(`📣 Sent socket notification to user ${userId}`);
    } else {
      console.log(`ℹ️ User ${userId} not connected via socket`);
    }

    return res
      .status(201)
      .json({ message: "Notification created", notification });
  } catch (error) {
    console.error("Error creating copy event notification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  markAsRead,
  deleteNotification,
  deleteOldNotifications,
  getAllNotificationsByUser,
  copyTextNotification,
  markMultipleAsRead,
};
