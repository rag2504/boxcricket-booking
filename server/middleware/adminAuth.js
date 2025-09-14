import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Lenient admin auth for admin-panel issued tokens in dev
// Tries main JWT secret first, then ADMIN_JWT_SECRET, then hardcoded fallback 'adminpanel_secret'
export const adminAuth = async (req, res, next) => {
  try {
    let token = req.header('Authorization') || req.header('authorization');
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    if (token.startsWith('Bearer ')) token = token.slice(7);

    const secretsToTry = [
      process.env.JWT_SECRET,
      process.env.ADMIN_JWT_SECRET,
      'adminpanel_secret',
    ].filter(Boolean);

    let decoded = null;
    let lastError = null;
    for (const secret of secretsToTry) {
      try {
        decoded = jwt.verify(token, secret);
        break;
      } catch (e) {
        lastError = e;
      }
    }

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // If token has userId, attach real user; else accept email/role for admin
    if (decoded.userId) {
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });
      req.userId = user._id;
      req.user = user;
      return next();
    }

    // Admin panel tokens usually carry { email, role }
    if (decoded.email) {
      const user = await User.findOne({ email: decoded.email });
      // If an admin user exists, use it; otherwise synthesize a minimal admin context
      if (user) {
        req.userId = user._id;
        req.user = user;
      } else {
        req.user = { _id: null, email: decoded.email, role: decoded.role || 'admin' };
      }
      return next();
    }

    return res.status(401).json({ success: false, message: 'Invalid token' });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export default adminAuth;



