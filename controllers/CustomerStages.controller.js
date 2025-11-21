const createCustomerStages = async (req, res) => {
  try {
    const { Customer, CustomerStages } = req.db; // ✅ Correct model name
    const { customerId, ...rest } = req.body;

    // ✅ 1. Authorization check
    if (!customerId) {
      return res
        .status(400)
        .json({ error: "Customer ID is required in the request body" });
    }

    // ✅ 2. DEBUG: Log customerId to verify
    console.log("Creating stage for customerId:", customerId);

    // ✅ 3. Check if the customer actually exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      console.log("Customer not found in database.");
      return res.status(400).json({ error: "Customer does not exist" });
    }

    // ✅ 4. Prevent duplicate customer stage record
    const existing = await CustomerStages.findOne({ where: { customerId } });
    if (existing) {
      return res.status(400).json({ error: "Customer stages already exist" });
    }

    // Create a new record
    const data = await CustomerStages.create({ customerId, ...rest });

    return res.status(201).json({
      message: "Customer stages created successfully",
      data,
    });
  } catch (error) {
    console.error("Create error:", {
      message: error.message,
      stack: error.stack,
      sql: error?.sql,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getCustomerStages = async (req, res) => {
  try {
    const { Customer, CustomerStages } = req.db;
    const customerId = req.user?.id;

    if (!customerId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Customer ID missing" });
    }

    // Optional: Check if customer exists (good for extra safety)
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const data = await CustomerStages.findOne({ where: { customerId } });

    if (!data) {
      return res.status(404).json({ error: "Customer stages not found" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch error:", {
      message: error.message,
      stack: error.stack,
      sql: error?.sql,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
};
const updateCustomerStages = async (req, res) => {
  try {
    const { Customer, CustomerStages } = req.db;
    const { customerId, ...rest } = req.body;

    if (!customerId) {
      return res
        .status(400)
        .json({ error: "Customer ID is required in the request body" });
    }

    // Check if the customer actually exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const [updated] = await CustomerStages.update(rest, {
      where: { customerId },
    });

    if (updated === 0) {
      return res
        .status(404)
        .json({ error: "No customer stages found to update" });
    }

    return res.status(200).json({
      message: "Customer stages updated successfully",
    });
  } catch (error) {
    console.error("Update error:", {
      message: error.message,
      stack: error.stack,
      sql: error?.sql,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getCustomerStagesById = async (req, res) => {
  try {
    const { Customer, CustomerStages } = req.db;

    // Accept customerId from query or params
    const customerId = req.query.customerId || req.params.customerId;

    if (!customerId) {
      return res
        .status(400)
        .json({ error: "Customer ID is required in query or params" });
    }

    // Optional: Validate that customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const data = await CustomerStages.findOne({
      where: { customerId },
    });

    if (!data) {
      return res.status(404).json({ error: "Customer stages not found" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch error:", {
      message: error.message,
      stack: error.stack,
      sql: error?.sql,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
};

const addStageComment = async (req, res) => {
  try {
    const { Customer, CustomerStages } = req.db;
    const { customerId, stageNumber, newComment } = req.body;

    if (!customerId || !stageNumber || !newComment) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (stageNumber < 1 || stageNumber > 15) {
      return res
        .status(400)
        .json({ error: "Stage number must be between 1 and 15" });
    }

    const stageKey = `stage${stageNumber}_data`;

    // ✅ Check if stage record exists
    let record = await CustomerStages.findOne({ where: { customerId } });

    // 🔄 If not exists, check if the customer is valid and create the base stage record
    if (!record) {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer does not exist" });
      }

      record = await CustomerStages.create({
        customerId,
        [stageKey]: [
          {
            comment: newComment,
            timestamp: new Date().toISOString(),
          },
        ],
      });

      return res.status(201).json({
        message: "Customer stages created and comment added",
        data: record[stageKey],
      });
    }

    const existingData = Array.isArray(record[stageKey])
      ? record[stageKey]
      : [];

    const updatedComments = [
      ...existingData,
      {
        comment: newComment,
        timestamp: new Date().toISOString(),
      },
    ];

    record[stageKey] = updatedComments;
    await record.save();

    return res
      .status(200)
      .json({ message: "Comment added successfully", data: updatedComments });
  } catch (error) {
    console.error("Add stage comment error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getStageComments = async (req, res) => {
  try {
    const { CustomerStages } = req.db;
    const { customerId, stageNumber } = req.query;

    if (!customerId || !stageNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (stageNumber < 1 || stageNumber > 15) {
      return res
        .status(400)
        .json({ error: "Stage number must be between 1 and 15" });
    }

    const stageKey = `stage${stageNumber}_data`; // ✅ corrected and defined

    const record = await CustomerStages.findOne({ where: { customerId } });

    if (!record) {
      return res.status(404).json({ error: "Customer stage record not found" });
    }

    const comments = Array.isArray(record[stageKey]) ? record[stageKey] : [];

    return res.status(200).json({ comments });
  } catch (error) {
    console.error("Get stage comments error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const addStageCommentAndNotify = async (req, res) => {
  try {
    const { Customer, CustomerStages, Notification } = req.db;
    const { customerId, stageNumber, newComment } = req.body;

    if (!customerId || !stageNumber || !newComment) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (stageNumber < 1 || stageNumber > 15) {
      return res
        .status(400)
        .json({ error: "Stage number must be between 1 and 15" });
    }

    const stageKey = `stage${stageNumber}_data`;

    // ✅ Ensure the customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer does not exist" });
    }

    // 🔄 Check if stage record exists
    let record = await CustomerStages.findOne({ where: { customerId } });

    if (!record) {
      // 🆕 Create new CustomerStages entry
      record = await CustomerStages.create({
        customerId,
        [stageKey]: [
          {
            comment: newComment,
            timestamp: new Date().toISOString(),
          },
        ],
      });
    } else {
      // ✏️ Append to existing stage comments
      const existingData = Array.isArray(record[stageKey])
        ? record[stageKey]
        : [];

      const updatedComments = [
        ...existingData,
        {
          comment: newComment,
          timestamp: new Date().toISOString(),
        },
      ];

      record[stageKey] = updatedComments;
      await record.save();
    }

    // ✅ Create notification for customer
    await Notification.create({
      customerId,
      message: `Reminder: ${newComment}`,
      targetRole: "customer",
    });

    return res.status(200).json({
      message: "Comment added and notification sent",
      data: record[stageKey],
    });
  } catch (error) {
    console.error("❌ Error adding comment and creating notification:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createCustomerStages,
  getCustomerStages,
  updateCustomerStages,
  getCustomerStagesById,
  addStageComment,
  getStageComments,
  addStageCommentAndNotify,
};
