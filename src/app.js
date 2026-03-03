const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes');
const serviceTypeRoutes = require('./routes/serviceTypeRoutes');
const userRoutes = require('./routes/userRoutes');
const slotRoutes = require('./routes/slotRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const staffServiceTypeRoutes = require('./routes/staffServiceTypeRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// ============ Security Middleware ============
app.use(helmet()); // for Security enaple all security headers
app.use(cors()); // for Cross-Origin Resource Sharing

// ============ Rate Limiting ============
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// ============ Body Parsing ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============ Request Logging ============
app.use(
    morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) },
    })
);

// ============ Static Files (uploads) ============
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ============ Health Check ============
app.get('/api/v1/health', (req, res) => {
    res.json({
        success: true,
        message: 'FlowCare API is running',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
    });
});

// ============ API Routes ============
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/branches', branchRoutes);
app.use('/api/v1/service-types', serviceTypeRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/slots', slotRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/staff-service-types', staffServiceTypeRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/uploads', uploadRoutes);

// ============ 404 Handler ============
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

// ============ Global Error Handler ============
app.use(errorHandler);

module.exports = app;
