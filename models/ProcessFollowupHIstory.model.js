const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProcessFollowUpHistory = sequelize.define(
    "ProcessFollowUpHistory",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fresh_lead_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "freshleads",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      process_person_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      connect_via: {
        type: DataTypes.ENUM("Call", "Email", "Call/Email"),
        allowNull: false,
      },
      follow_up_type: {
        type: DataTypes.ENUM(
          "document collection",
          "payment follow-up",
          "visa filing",
          "other",
          "rejected",
          "final",
          "meeting"
        ),
        allowNull: false,
      },
      interaction_rating: {
        type: DataTypes.ENUM("Agressive", "Calm", "Neutral"),
        allowNull: false,
      },
      follow_up_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      follow_up_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      comments: {
        type: DataTypes.TEXT,
      },
      document_name: {
        type: DataTypes.STRING,
        allowNull: true, // Only used when follow_up_type = 'document collection'
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
      tableName: "processfollowuphistories",
      freezeTableName: true,
      timestamps: true,
    }
  );

  return ProcessFollowUpHistory;
};
