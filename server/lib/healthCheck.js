// Health check middleware for the API

/**
 * Health check middleware
 * Provides detailed health information about the API
 */
export const healthCheck = (req, res) => {
  // Get MongoDB connection status from app settings
  const isMongoConnected = req.app.get("mongoConnected")();

  // Basic system information
  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  };

  // Environment information
  const envInfo = {
    nodeEnv: process.env.NODE_ENV || 'development',
    isRender: process.env.RENDER === 'true',
    port: process.env.PORT || 3001,
    frontendUrl: process.env.FRONTEND_URL,
  };

  // Service status checks
  const services = {
    database: {
      status: isMongoConnected ? 'connected' : 'disconnected',
      type: 'MongoDB Atlas',
    },
    email: {
      status: (process.env.RESEND_API_KEY || process.env.BREVO_API_KEY || (process.env.EMAIL_HOST && process.env.EMAIL_PASS)) ? 'configured' : 'not configured',
      provider: process.env.RESEND_API_KEY ? 'resend' : process.env.BREVO_API_KEY ? 'brevo' : process.env.EMAIL_HOST || 'not set',
    },
    payments: {
      status: process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? 'configured' : 'not configured',
      provider: 'Razorpay',
    },
  };

  // Prepare response
  const response = {
    status: isMongoConnected ? 'OK' : 'DEGRADED',
    message: isMongoConnected ? 'BoxCric API is running successfully!' : 'BoxCric API is running with degraded functionality (database disconnected)',
    timestamp: new Date().toISOString(),
    mongoConnected: isMongoConnected,
    environment: envInfo,
    services,
    system: systemInfo,
  };

  res.json(response);
};