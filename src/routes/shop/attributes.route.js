const attributeModel = require("../../models/attribute.model");
const express = require("express");
const productModel = require("../../models/product.model");
const router = express.Router();

async function isAttributeUsed(attributeId) {
  return await productModel.exists({ attributeIds: attributeId });
}


router.get('/all', async (req, res) => {
  try {
    const attributes = await attributeModel.find({ isDeleted: { $ne: true } });

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
      const newValues = valuaes.filter(val => !existing.values.includes(val));

      if (newValues.length === 0) {
        return res.status(200).json({ success: true, message: "Thuộc tính đã tồn tại và không có giá trị mới.", attribute: existing });
      }

      // Cập nhật thuộc tính với các giá trị mới
      existing.values = [...existing.values, ...newValues];
      await existing.save();

      return res.status(200).json({ success: true, message: "Đã cập nhật thêm giá trị mới vào thuộc tính.", attribute: existing });
    }

    // Nếu chưa tồn tại, tạo mới
    const newAttr = await attributeModel.create({ name, values, isDeleted: false });

    res.status(201).json({ success: true, message: "Đã tạo thuộc tính mới.", attribute: newAttr });

  } catch (err) {
    console.error('Lỗi tạo/cập nhật thuộc tính:', err);
    res.status(500).json({ success: false, message: "Lỗi server khi tạo/cập nhật thuộc tính." });
  }
});

router.put('/:id', async (req, res) => {
  const { name, values } = req.body;

  if (!name || !Array.isArray(values)) {
    return res.status(400).json({ success: false, message: "Thiếu tên hoặc danh sách giá trị." });
  }

  try {
    const used = await isAttributeUsed(req.params.id);
    if (used) {
      return res.status(400).json({ success: false, message: "Thuộc tính đang được sử dụng. Không thể sửa." });
    }

    const updated = await attributeModel.findByIdAndUpdate(
      req.params.id,
      { name, values },
      { new: true }
    );

    res.json({ success: true, message: "Cập nhật thành công.", attribute: updated });

  } catch (err) {
    console.error("Lỗi cập nhật:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi cập nhật." });
  }
});

// ✅ DELETE - Xoá mềm nếu chưa được dùng
router.delete('/:id', async (req, res) => {
  try {
    const used = await isAttributeUsed(req.params.id);
    console.log("Used:", used); // Kiểm tra xem thuộc tính có đang được sử dụng không
    
    if (used) {
      return res.status(400).json({ success: false, message: "Thuộc tính đang được sử dụng. Không thể xoá." });
    }

    await attributeModel.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ success: true, message: "Đã xoá thuộc tính (mềm)." });

  } catch (err) {
    console.error("Lỗi xoá:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi xoá." });
  }
});

module.exports = router; // ✅ Đảm bảo export router
