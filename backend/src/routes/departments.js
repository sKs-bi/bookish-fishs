const express = require('express');
const { body } = require('express-validator');
const departmentController = require('../controllers/departmentController');
const { auth, requireSuperAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.get('/tree', departmentController.getDepartmentTree);
router.get('/', auth, departmentController.getDepartments);
router.get('/:id', auth, departmentController.getDepartmentById);

router.post('/', auth, requireSuperAdmin, [
    body('name').notEmpty().withMessage('部门名称不能为空')
], validate, departmentController.createDepartment);

router.put('/:id', auth, requireSuperAdmin, departmentController.updateDepartment);

router.delete('/:id', auth, requireSuperAdmin, departmentController.deleteDepartment);

module.exports = router;
