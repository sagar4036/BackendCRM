const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const customerDocController = require("../controllers/CustomerDocument.controller");

// Route for uploading documents
router.post("/document/upload", customerDocController.uploadDocuments);

// Get documents by customerId with auth middleware
router.get("/document", auth(), customerDocController.getDocumentsByAuth);

router.get(
  "/document/:userType/:customerId",
  customerDocController.getDocumentsByCustomerIdFromRequest
);

router.delete("/document/:id", customerDocController.deleteDocumentById);
module.exports = router;
