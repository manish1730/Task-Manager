const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const {
  createProject, getProjects, updateProject,
  deleteProject, addMember, removeMember
} = require('../controllers/projectController');

router.post('/',                protect, allowRoles('admin'), createProject);
router.get('/',                 protect, getProjects);
router.put('/:id',              protect, allowRoles('admin'), updateProject);
router.delete('/:id',           protect, allowRoles('admin'), deleteProject);
router.put('/:id/members/add',  protect, allowRoles('admin'), addMember);
router.put('/:id/members/remove', protect, allowRoles('admin'), removeMember);

module.exports = router;
