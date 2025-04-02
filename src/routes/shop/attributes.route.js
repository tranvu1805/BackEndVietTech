const attributeModel = require("../../models/attribute.model");
const express = require("express");
const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    const attributes = await attributeModel.find({});
    res.json({ success: true, attributes }); // ✅ Trả về đúng dạng JSON
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy thuộc tính' });
  }
});

router.post('/', async (req, res) => {
  const { name, values } = req.body;

  if (!name || !Array.isArray(values)) {
    return res.status(400).json({ success: false, message: "Thiếu tên hoặc danh sách giá trị." });
  }

  try {
    let existing = await attributeModel.findOne({ name });

    if (existing) {
      // Tìm các giá trị mới chưa có
      const newValues = values.filter(val => !existing.values.includes(val));

      if (newValues.length === 0) {
        return res.status(200).json({ success: true, message: "Thuộc tính đã tồn tại và không có giá trị mới.", attribute: existing });
      }

      // Cập nhật thuộc tính với các giá trị mới
      existing.values = [...existing.values, ...newValues];
      await existing.save();

      return res.status(200).json({ success: true, message: "Đã cập nhật thêm giá trị mới vào thuộc tính.", attribute: existing });
    }

    // Nếu chưa tồn tại, tạo mới
    const newAttr = await attributeModel.create({ name, values });
    res.status(201).json({ success: true, message: "Đã tạo thuộc tính mới.", attribute: newAttr });

  } catch (err) {
    console.error('Lỗi tạo/cập nhật thuộc tính:', err);
    res.status(500).json({ success: false, message: "Lỗi server khi tạo/cập nhật thuộc tính." });
  }
});


module.exports = router; // ✅ Đảm bảo export router
