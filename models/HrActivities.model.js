const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "HrActivity",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      hr_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "hrs",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      activityDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      workTime: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      workStartTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      breakTime: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      breakStartTime: {
        type: DataTypes.DATE,
        allowNull: true,
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
      tableName: "hr_activities",
      freezeTableName: true,
      timestamps: true,
      uniqueKeys: {
        daily_activity_unique: {
          fields: ["hr_id", "activityDate"],
        },
      },
    }
  );
};
