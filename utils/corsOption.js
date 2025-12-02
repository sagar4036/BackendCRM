// utils/corsOption.js

const allowedOrigins = [
  "https://frontend-crm-seven.vercel.app", 
  "http://localhost:3000",                 
];

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) || 
      origin.endsWith(".vercel.app")         
    ) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS Origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },

  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: "*",
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
