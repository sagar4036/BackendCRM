module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "FollowupNotification",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users", // ✅ reference your User model's table
          key: "id",
        },
        onDelete: "CASCADE",
      },
      message: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      remindAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      targetRole: {
        type: DataTypes.STRING,
        defaultValue: "executive",
      },
      is_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "followup_notifications",
      freezeTableName: true,
      timestamps: true,
    }
  );
};
