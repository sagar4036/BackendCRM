const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CustomerDocument = sequelize.define(
    "CustomerDocument",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "customers", // matches table name defined in your Customer model
          key: "id",
        },
        onDelete: "CASCADE", // delete documents if customer is deleted
      },
      documentName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mimeType: {
        type: DataTypes.STRING,
        allowNull: false, // e.g., "application/pdf", "image/jpeg"
      },
      documentData: {
        type: DataTypes.BLOB("long"), // stores binary data
        allowNull: false,
      },
      uploadedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      userType: {
        type: DataTypes.ENUM("customer", "process_person"),
        allowNull: false,
        defaultValue: "customer",
      },
    },
    {
      tableName: "customer_documents",
      freezeTableName: true,
      timestamps: false, // manually control uploadedAt
    }
  );

  return CustomerDocument;
};
