const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://frontend-crm-seven.vercel.app",
      "http://localhost:3000"
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS Origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },

  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

  credentials: true,

  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "x-company-id"
  ],

  exposedHeaders: ["x-company-id"],

  optionsSuccessStatus: 200,
};
