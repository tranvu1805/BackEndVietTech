const mongoose = require("mongoose");
require("dotenv").config({ path: "../../.env" });
const Category = require("../../models/category.model"); // Đảm bảo đường dẫn đúng



// 🔹 Kết nối đến MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const categories = [
    {
        name: "Smartphone",
        attributes_template: ["battery_life", "camera_quality", "screen_size", "storage_capacity", "ram", "operating_system", "chipset"]
    },
    {
        name: "Laptop",
        attributes_template: ["processor", "ram", "storage_capacity", "screen_size", "battery_life", "operating_system", "graphics_card"]
    },
    {
        name: "Tablet",
        attributes_template: ["battery_life", "screen_size", "storage_capacity", "ram", "operating_system", "stylus_support"]
    },
    {
        name: "Electronics Accessories",
        attributes_template: ["type", "compatibility", "color", "material"]
    },
    {
        name: "Headphones",
        attributes_template: ["type", "connectivity", "battery_life", "noise_cancellation", "color"]
    },
    {
        name: "Mouse",
        attributes_template: ["type", "dpi", "connection_type", "battery_life", "color"]
    },
    {
        name: "Keyboard",
        attributes_template: ["type", "connectivity", "backlight", "mechanical", "color"]
    },
    {
        name: "TV",
        attributes_template: ["screen_size", "resolution", "smart_tv", "refresh_rate", "display_technology"]
    },
    {
        name: "Camera",
        attributes_template: ["resolution", "zoom", "lens_type", "battery_life", "video_resolution"]
    },
    {
        name: "Smartwatch",
        attributes_template: ["battery_life", "screen_size", "compatibility", "water_resistant", "health_monitoring"]
    },
    {
        name: "Speakers",
        attributes_template: ["type", "connectivity", "battery_life", "waterproof", "color"]
    },
    {
        name: "Power Bank",
        attributes_template: ["capacity", "output_ports", "battery_type", "fast_charging"]
    },
    {
        name: "Desktop Computer",
        attributes_template: ["processor", "ram", "storage_capacity", "graphics_card", "power_supply"]
    }
];

const seedCategories = async () => {
    try {
        await Category.deleteMany(); // Xóa hết danh mục cũ
        const insertedCategories = await Category.insertMany(categories);
        console.log("✅ Categories seeded successfully!", insertedCategories);
    } catch (error) {
        console.error("❌ Error seeding categories:", error);
    } finally {
        mongoose.connection.close();
    }
};

// 🔥 Chạy seed
seedCategories();
