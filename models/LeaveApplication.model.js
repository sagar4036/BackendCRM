const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "LeaveApplication",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // Foreign key to users.id
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users", // must match actual table name
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      // Employee Info Snapshot
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      positionTitle: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // Leave Details
      leaveType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      totalDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Auto-calculated or provided by frontend",
      },
      status: {
        type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
        allowNull: false,
        defaultValue: "Pending",
      },
      appliedDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      // Additional Information
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      emergencyContactName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      emergencyPhone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      workHandoverTo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      handoverNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // HR Response
      hrComment: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "HR comment for approval/rejection decision",
      },

      // Supporting Document Path
      supportingDocumentPath: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "File path or URL for uploaded document",
      },

      // Timestamps
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "leave_applications",
      freezeTableName: true,
      timestamps: true,
    }
  );
};