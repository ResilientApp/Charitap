/**
 * CORS Configuration
 * Update allowed origins for production
 */

const allowedOrigins = [
  'http://localhost:3000',              // Local development
  'https://charitap.com',              // Production frontend
  'https://www.charitap.com',          // Production frontend (www)
  'https://app.charitap.com',          // Production app
  // Add more production domains as needed
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID']
};

module.exports = { corsOptions, allowedOrigins };
