const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "Payroll",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      designation: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      gross_salary: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      total_present_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      total_working_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      deductions: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      net_salary: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      month: {
        type: DataTypes.STRING, // e.g., "2025-07"
        allowNull: false,
      },
    },
    {
      tableName: "payroll", // ✅ matches schema convention
      freezeTableName: true, // ✅ disables auto-pluralization
      timestamps: true, // ✅ enables Sequelize time tracking
    }
  );
};
