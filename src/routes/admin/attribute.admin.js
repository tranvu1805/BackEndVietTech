// File: routes/admin/review.routes.js
const express = require("express");
const attributeModel = require("../../models/attribute.model");
const router = express.Router();



// GET /v1/api/admin/attributes
router.get('/list', async (req, res) => {
    try {
      const attributes = await attributeModel.find({ isDeleted: { $ne: true } });
      res.render('attributes/list', { attributes });
    } catch (error) {
      res.status(500).send('Lỗi khi tải danh sách thuộc tính.');
    }
  });
  



module.exports = router;
