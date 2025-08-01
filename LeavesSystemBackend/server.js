const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');

const app = express();

// Route imports
const authRoutes = require('./routes/authRoutes');
const staffRoutes = require('./routes/staffRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const jobTitleRoutes = require('./routes/jobTitleRoutes');
const jobGroupRoutes = require('./routes/jobGroupRoutes');
const userRoutes = require('./routes/userRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ADDED

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/jobtitles', jobTitleRoutes);
app.use('/api/jobgroups', jobGroupRoutes);
app.use('/api/user', userRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
