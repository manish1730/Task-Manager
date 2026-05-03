const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { createTask, getTasks, updateTask, deleteTask } = require('../controllers/taskController');

router.post('/',      protect, createTask);
router.get('/',       protect, getTasks);
router.put('/:id',    protect, updateTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;
