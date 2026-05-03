const router = require('express').Router();
const { register, login, getAllUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.post('/register', register);
router.post('/login',    login);
router.get('/users',     protect, adminOnly, getAllUsers);

module.exports = router;
