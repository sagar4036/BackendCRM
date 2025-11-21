const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Hr = sequelize.define(
    "Hr",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "HR",
      },
      jobTitle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      can_login: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      tableName: "hrs", // ✅ lowercase table name as requested
      freezeTableName: true, // ✅ no pluralization
      timestamps: true, // ✅ enables Sequelize to manage timestamps
    }
  );

  return Hr;
};