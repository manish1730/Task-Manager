const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  next();
};

const adminOnly = allowRoles('admin');
const memberOnly = allowRoles('admin', 'member');

module.exports = { allowRoles, adminOnly, memberOnly };
