const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users", // ✅ lowercase to match Users table
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true, // make it optional if not all notifications are for customers
        references: {
          model: "customers", // ✅ must match your actual table name
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      hr_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // make it optional if not all notifications are for customers
        references: {
          model: "hrs", // ✅ must match your actual table name
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      targetRole: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "executive",
      },
      message: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
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
      tableName: "notifications", // ✅ lowercase and consistent
      freezeTableName: true, // ✅ avoids Sequelize renaming
      timestamps: true, // ✅ ensures correct tracking
    }
  );

  return Notification;
};
