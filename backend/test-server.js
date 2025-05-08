const express = require('express');
const app = express();
const myRoute = require('./routes/myRoute');

// Middleware to parse JSON requests (optional but usually needed)
app.use(express.json());

// Mount the route
app.use('/', myRoute);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
