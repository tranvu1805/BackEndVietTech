const express = require('express');
const { getAccount, getAllAccount } = require('../../controllers/account.controller');
const accountController = require('../../controllers/account.controller');
const roleModel = require('../../models/role.model');

const router = express.Router();

// Admin page hiển thị danh sách
router.get("/list", async (req, res, next) => {
    try {
        const users = await accountController.getAllAccount(req, res, next);

        const roles = await roleModel.find().lean(); // ✅ lấy danh sách vai trò

        res.render("admin/user-list", {
            users,
            roles, // ✅ truyền thêm biến roles vào view
            currentPage: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            search: req.query.search || ""
        });
    } catch (error) {
        console.error("Error loading users:", error);
        res.status(500).send("Error loading users!");
    }
});

// router.get('/admin/users/create', accessController.renderCreateForm); // optional

// // API
// router.post('/users', accessController.createUser);
// router.put('/users/:id', accessController.updateUser);
// router.delete('/users/:id', accessController.deleteUser);

// // Lọc (AJAX partial render)
// router.get('/admin/users/partial', accessController.renderPartialList);

// // API lấy role nếu cần
// router.get('/roles', accessController.getAllRoles);

module.exports = router;
