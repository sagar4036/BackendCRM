const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "ProcessPersonActivity",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      process_person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "process_persons",
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
      tableName: "process_person_activities",
      freezeTableName: true,
      timestamps: true,
      uniqueKeys: {
        daily_activity_unique: {
          fields: ["process_person_id", "activityDate"],
        },
      },
    }
  );
};
