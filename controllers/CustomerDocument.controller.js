const multer = require("multer");

// Multer setup using memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage }).array("documents"); // field name should be 'documents'

exports.uploadDocuments = (req, res) => {
  const CustomerDocument = req.db.CustomerDocument;

  upload(req, res, async function (err) {
    if (err) {
      console.error("Multer error:", err);
      return res
        .status(400)
        .json({ message: "File upload error.", error: err.message });
    }

    const { customerId, userType, documentNames } = req.body;

    if (!customerId || !userType || !req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "Missing customerId, userType, or files." });
    }

    // Validate userType
    const allowedUserTypes = ["customer", "process_person"];
    if (!allowedUserTypes.includes(userType)) {
      return res.status(400).json({
        message: "Invalid userType. Must be 'customer' or 'process_person'.",
      });
    }

    // Parse documentNames (stringified array from frontend)
    let parsedNames = [];
    try {
      parsedNames = JSON.parse(documentNames);
    } catch (err) {
      return res.status(400).json({ message: "Invalid documentNames format." });
    }

    if (parsedNames.length !== req.files.length) {
      return res.status(400).json({
        message: "Mismatch between number of files and document names.",
      });
    }

    try {
      const documents = await Promise.all(
        req.files.map((file, index) => {
          const ext = file.originalname.split(".").pop();
          const customFileName = `${parsedNames[index]}.${ext}`;
          return CustomerDocument.create({
            customerId,
            documentName: customFileName,
            mimeType: file.mimetype,
            documentData: file.buffer,
            userType,
          });
        })
      );

      res.status(201).json({
        message: "Documents uploaded successfully.",
        documents,
      });
    } catch (error) {
      console.error("Upload Error:", error);
      res
        .status(500)
        .json({ message: "Error saving documents to the database." });
    }
  });
};

exports.getDocumentsByAuth = async (req, res) => {
  const CustomerDocument = req.db.CustomerDocument;
  try {
    const customerId = req.user.id;

    if (!customerId) {
      return res
        .status(400)
        .json({ message: "Missing customerId in request." });
    }

    const documents = await CustomerDocument.findAll({
      where: { customerId },
      attributes: [
        "id",
        "documentName",
        "mimeType",
        "uploadedAt",
        "documentData",
      ],
    });

    if (!documents || documents.length === 0) {
      return res
        .status(404)
        .json({ message: "No documents found for this customer." });
    }

    // Convert binary data to base64 for safe transfer
    const response = documents.map((doc) => ({
      id: doc.id,
      documentName: doc.documentName,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      base64Data: doc.documentData.toString("base64"),
    }));

    res.status(200).json({ documents: response });
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Error fetching documents." });
  }
};

exports.getDocumentsByCustomerIdFromRequest = async (req, res) => {
  const CustomerDocument = req.db.CustomerDocument;

  // Extract customerId and userType from request
  const customerId =
    req.body.customerId || req.query.customerId || req.params.customerId;
  const userType =
    req.body.userType || req.query.userType || req.params.userType;

  if (!customerId || !userType) {
    return res
      .status(400)
      .json({ message: "Customer ID and userType are required." });
  }

  const allowedUserTypes = ["customer", "process_person"];
  if (!allowedUserTypes.includes(userType)) {
    return res.status(400).json({ message: "Invalid userType." });
  }

  try {
    const documents = await CustomerDocument.findAll({
      where: {
        customerId,
        userType,
      },
      attributes: [
        "id",
        "documentName",
        "mimeType",
        "uploadedAt",
        "documentData",
      ],
    });

    if (!documents || documents.length === 0) {
      return res.status(404).json({
        message: "No documents found for this customer and userType.",
      });
    }

    const response = documents.map((doc) => ({
      id: doc.id,
      documentName: doc.documentName,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      base64Data: doc.documentData.toString("base64"),
    }));

    res.status(200).json({ documents: response });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: "Error fetching documents." });
  }
};

exports.deleteDocumentById = async (req, res) => {
  const CustomerDocument = req.db.CustomerDocument;
  const { id } = req.params;
  const userType =
    req.body.userType || req.query.userType || req.params.userType;

  if (!id || !userType) {
    return res
      .status(400)
      .json({ message: "Document ID and userType are required." });
  }

  if (userType !== "process_person") {
    return res
      .status(403)
      .json({ message: "Only process_person can delete documents." });
  }

  try {
    const document = await CustomerDocument.findByPk(id);

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    await document.destroy();

    res.status(200).json({ message: "Document deleted successfully." });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Error deleting document." });
  }
};
