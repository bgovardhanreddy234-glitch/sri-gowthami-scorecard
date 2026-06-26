const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON payloads
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Serve Static Frontend files in Production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Fallback to React index.html for client-side routing
app.get('*', (req, res) => {
  // Check if static index.html exists, otherwise just send a default message or handle
  const indexHtml = path.join(clientDistPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(200).json({ status: 'API is running. Client build not found.' });
  }
});

// Database Auth & Startup
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync models to database (does not drop since force is false by default)
    await sequelize.sync();

    // Auto-seed in serverless environment if database is empty
    const { User } = require('./models');
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('Database is empty. Seeding default data...');
      const seed = require('./seeders/seed');
      await seed();
    }
    
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('Unable to connect to the database or start server:', error);
  }
}

startServer();

module.exports = app;
