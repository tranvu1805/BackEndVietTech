const express = require("express");
const { getAllCategories_Admin } = require("../../controllers/category.controller");
const { getAllProducts_Admin, getProductById_Admin, exportProductsToExcel, getTopSellingProducts, markAsDraft_Admin, toggleProductStatus_Admin } = require("../../controllers/product.controller");
const asyncHandler = require("../../helpers/asyncHandler");
const detailsVariantModel = require("../../models/detailsVariant.model");
const attributeModel = require("../../models/attribute.model");
const router = express.Router();


router.get("/list", async (req, res) => {
    try {
        const result = await getAllProducts_Admin(req, res);


        for (const product of result.products) {
            const variants = await detailsVariantModel.find({ productId: product._id }).populate('variantDetails.variantId');
            console.log("check variants: ", variants[1]);

            product.detailsVariants = variants;
        }



        // console.log("check product: ", result.products[result.products.length - 1].detailsVariants);


        res.render("admin/product-list", {
            products: result.products,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            query: req.query,

        });
    } catch (error) {
        console.error("Error loading products:", error);
        res.status(500).send("Error loading products!");
    }
});

router.put("/:id/toggle-status", asyncHandler(toggleProductStatus_Admin));



router.get("/create", async (req, res) => {
    try {
        // Lấy tất cả danh mục từ cơ sở dữ liệu
        const categories = await getAllCategories_Admin();
        const attributes = await attributeModel.find(); // hoặc theo category nếu cần
        console.log("check attributes: ", attributes);

        // Render view với categories và một sản phẩm rỗng (dùng cho tạo mới)
        res.render("admin/product-form", { action: "Create", product: {}, categories, attributes });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Error loading categories!");
    }
});

router.get("/edit/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const rawProduct = await getProductById_Admin(id);
        const product = rawProduct.toObject(); // ✅ chuyển thành object thường

        const categories = await getAllCategories_Admin();
        const attributes = await attributeModel.find();

        if (!product) {
            return res.status(404).send("Product not found");
        }

        // ✅ Lấy các biến thể chi tiết
        const variants = await detailsVariantModel.find({ productId: product._id }).populate('variantDetails.variantId');

        // ✅ Chuyển variantDetails sang dạng combination: { Color: 'Đỏ', Size: 'M' }
        product.variants = variants.map(v => {
            const combination = {};
            v.variantDetails.forEach(d => {
                combination[d.variantId.name] = d.value;
            });

            return {
                combination,
                price: v.price,
                stock: v.stock,
                sku: v.sku,
            };
        });

        console.log("check product: ", product);


        // ✅ Trả về cả attributes nếu cần render lại thuộc tính
        res.render("admin/product-form", {
            action: "Edit",
            product,
            categories,
            attributes
        });
    } catch (error) {
        console.error("Error loading product:", error);
        res.status(500).send("Error loading product!");
    }
});


router.get('/export', async (req, res, next) => {
    try {
        await exportProductsToExcel(req, res, next);  // Gọi phương thức xuất Excel
    } catch (error) {
        next(error);
    }
});


module.exports = router;