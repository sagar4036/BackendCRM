// utils/corsOption.js

const allowedOrigins = [
  "https://crm-frontend-delta-ebon.vercel.app",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS Origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },

  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

  credentials: true,

  // ✅ ALLOW ALL HEADERS
  allowedHeaders: "*", // <---- FIX

  // ✅ Allow preflight success
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
