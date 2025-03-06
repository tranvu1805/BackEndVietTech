const mongoose = require("mongoose");
require("dotenv").config({ path: "../../../.env" });
const Product = require("../../models/product.model");

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const products = [
    {
        "product_name": "iPhone 15 Pro Max",
        "product_thumbnail": "https://example.com/iphone15.jpg",
        "product_description": "Flagship smartphone from Apple with A17 Pro chip.",
        "product_price": 1299.99,
        "product_stock": 50,
        "category": "67c7364bfe33f580e7b1d3a1",
        "product_attributes": {
            "battery_life": "29 hours",
            "camera_quality": "48MP",
            "screen_size": "6.7 inches",
            "storage_capacity": "256GB",
            "ram": "8GB",
            "operating_system": "iOS",
            "chipset": "Apple A17 Pro"
        }
    },
    {
        "product_name": "Samsung Galaxy S23 Ultra",
        "product_thumbnail": "https://example.com/s23ultra.jpg",
        "product_description": "Samsung's flagship with S-Pen and powerful camera.",
        "product_price": 1199.99,
        "product_stock": 40,
        "category": "67c7364bfe33f580e7b1d3a1",
        "product_attributes": {
            "battery_life": "24 hours",
            "camera_quality": "200MP",
            "screen_size": "6.8 inches",
            "storage_capacity": "512GB",
            "ram": "12GB",
            "operating_system": "Android",
            "chipset": "Snapdragon 8 Gen 2"
        }
    },
    {
        "product_name": "MacBook Pro 16 M2",
        "product_thumbnail": "https://example.com/macbookpro16.jpg",
        "product_description": "Powerful MacBook Pro with M2 Pro chip.",
        "product_price": 2499.99,
        "product_stock": 20,
        "category": "67c73654fe33f580e7b1d3a3",
        "product_attributes": {
            "processor": "Apple M2 Pro",
            "ram": "32GB",
            "storage_capacity": "1TB SSD",
            "screen_size": "16 inches",
            "battery_life": "20 hours",
            "operating_system": "macOS",
            "graphics_card": "Integrated M2 GPU"
        }
    },
    {
        "product_name": "LG OLED C2 55” TV",
        "product_thumbnail": "https://example.com/lgoledc2.jpg",
        "product_description": "4K OLED Smart TV with deep blacks and AI processor.",
        "product_price": 1299.99,
        "product_stock": 10,
        "category": "67c73682fe33f580e7b1d3af",
        "product_attributes": {
            "screen_size": "55 inches",
            "resolution": "4K",
            "smart_tv": true,
            "refresh_rate": "120Hz",
            "display_technology": "OLED"
        }
    },
    {
        "product_name": "Sony A7 IV Mirrorless Camera",
        "product_thumbnail": "https://example.com/sonya7iv.jpg",
        "product_description": "High-performance mirrorless camera with 33MP sensor.",
        "product_price": 2499.99,
        "product_stock": 12,
        "category": "67c7368ffe33f580e7b1d3b1",
        "product_attributes": {
            "resolution": "33MP",
            "zoom": "Optical Zoom 10x",
            "lens_type": "Full-frame",
            "battery_life": "600 shots",
            "video_resolution": "4K 60fps"
        }
    },
    {
        "product_name": "Anker PowerCore 20000",
        "product_thumbnail": "https://example.com/ankerpowercore.jpg",
        "product_description": "High-capacity portable power bank with fast charging.",
        "product_price": 49.99,
        "product_stock": 100,
        "category": "67c736a3fe33f580e7b1d3b7",
        "product_attributes": {
            "capacity": "20000mAh",
            "output_ports": 2,
            "battery_type": "Lithium-ion",
            "fast_charging": true
        }
    }
]
    ;

const seedProducts = async () => {
    try {
        await Product.insertMany(products);
        console.log("Products added successfully!");
    } catch (error) {
        console.error("Error seeding products:", error);
    } finally {
        mongoose.connection.close();
    }
};

seedProducts();
