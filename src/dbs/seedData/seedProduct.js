const mongoose = require("mongoose");
require("dotenv").config({ path: "../../../.env" });
const Product = require("../../models/product.model");

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const products = [
    {
        "product_name": "iPhone 14 Pro Max",
        "product_thumbnail": "https://example.com/iphone14.jpg",
        "product_description": "Flagship smartphone with A16 Bionic chip.",
        "product_price": 1099.99,
        "product_stock": 100,
        "category": "67c9c927de7f8ec2801605ae", // Điện thoại
        "product_attributes": {
            "battery_life": "23 hours",
            "camera_quality": "48MP",
            "screen_size": "6.1 inches",
            "storage_capacity": "128GB",
            "ram": "6GB",
            "operating_system": "iOS",
            "chipset": "Apple A16 Bionic"
        },
        "variations": [
            {
                "variant_name": "Storage",
                "variant_value": "128GB",
                "price": 1099.99,
                "stock": 100,
                "sku": "IPHONE-14-PRO-128GB"
            },
            {
                "variant_name": "Storage",
                "variant_value": "256GB",
                "price": 1199.99,
                "stock": 80,
                "sku": "IPHONE-14-PRO-256GB"
            },
            {
                "variant_name": "Storage",
                "variant_value": "512GB",
                "price": 1399.99,
                "stock": 50,
                "sku": "IPHONE-14-PRO-512GB"
            },
            {
                "variant_name": "Color",
                "variant_value": "Silver",
                "price": 1099.99,
                "stock": 100,
                "sku": "IPHONE-14-PRO-SILVER"
            },
            {
                "variant_name": "Color",
                "variant_value": "Gold",
                "price": 1199.99,
                "stock": 80,
                "sku": "IPHONE-14-PRO-GOLD"
            },
            {
                "variant_name": "Color",
                "variant_value": "Space Gray",
                "price": 1099.99,
                "stock": 120,
                "sku": "IPHONE-14-PRO-SPACE-GRAY"
            }
        ]
    },
    {
        "product_name": "Samsung Galaxy Z Fold 5",
        "product_thumbnail": "https://example.com/galaxyzfold5.jpg",
        "product_description": "Foldable smartphone with 5G and AMOLED screen.",
        "product_price": 1799.99,
        "product_stock": 30,
        "category": "67c9c927de7f8ec2801605ae", // Điện thoại
        "product_attributes": {
            "battery_life": "22 hours",
            "camera_quality": "50MP",
            "screen_size": "7.6 inches",
            "storage_capacity": "512GB",
            "ram": "12GB",
            "operating_system": "Android",
            "chipset": "Snapdragon 8 Gen 2"
        },
        "variations": [
            {
                "variant_name": "Storage",
                "variant_value": "512GB",
                "price": 1799.99,
                "stock": 30,
                "sku": "GALAXY-FOLD-512GB"
            },
            {
                "variant_name": "Storage",
                "variant_value": "1TB",
                "price": 1999.99,
                "stock": 20,
                "sku": "GALAXY-FOLD-1TB"
            },
            {
                "variant_name": "Color",
                "variant_value": "Phantom Black",
                "price": 1799.99,
                "stock": 30,
                "sku": "GALAXY-FOLD-BLACK"
            },
            {
                "variant_name": "Color",
                "variant_value": "Bespoke Edition",
                "price": 1899.99,
                "stock": 15,
                "sku": "GALAXY-FOLD-BESPOKE"
            }
        ]
    },
    {
        "product_name": "Sony PlayStation 5",
        "product_thumbnail": "https://example.com/ps5.jpg",
        "product_description": "Next-gen gaming console with ultra-fast SSD.",
        "product_price": 499.99,
        "product_stock": 150,
        "category": "67c9c927de7f8ec2801605b1", // Phụ kiện điện tử
        "product_attributes": {
            "processor": "AMD Ryzen",
            "ram": "16GB",
            "storage_capacity": "825GB SSD",
            "graphics_card": "AMD RDNA 2",
            "operating_system": "PlayStation OS"
        },
        "variations": [
            {
                "variant_name": "Color",
                "variant_value": "White",
                "price": 499.99,
                "stock": 150,
                "sku": "PS5-WHITE"
            },
            {
                "variant_name": "Version",
                "variant_value": "Standard",
                "price": 499.99,
                "stock": 100,
                "sku": "PS5-STANDARD"
            },
            {
                "variant_name": "Version",
                "variant_value": "Digital Edition",
                "price": 399.99,
                "stock": 50,
                "sku": "PS5-DIGITAL"
            }
        ]
    },
    {
        "product_name": "MacBook Pro 16 M2",
        "product_thumbnail": "https://example.com/macbookpro16.jpg",
        "product_description": "Powerful MacBook Pro with M2 Pro chip.",
        "product_price": 2499.99,
        "product_stock": 20,
        "category": "67c9c927de7f8ec2801605af", // Laptop
        "product_attributes": {
            "processor": "Apple M2 Pro",
            "ram": "32GB",
            "storage_capacity": "1TB SSD",
            "screen_size": "16 inches",
            "battery_life": "20 hours",
            "operating_system": "macOS",
            "graphics_card": "Integrated M2 GPU"
        },
        "variations": [
            {
                "variant_name": "Storage",
                "variant_value": "1TB SSD",
                "price": 2499.99,
                "stock": 20,
                "sku": "MACBOOK-PRO-16-1TB"
            },
            {
                "variant_name": "Storage",
                "variant_value": "2TB SSD",
                "price": 2799.99,
                "stock": 10,
                "sku": "MACBOOK-PRO-16-2TB"
            },
            {
                "variant_name": "Color",
                "variant_value": "Space Gray",
                "price": 2499.99,
                "stock": 20,
                "sku": "MACBOOK-PRO-16-SPACE-GRAY"
            },
            {
                "variant_name": "Color",
                "variant_value": "Silver",
                "price": 2499.99,
                "stock": 20,
                "sku": "MACBOOK-PRO-16-SILVER"
            }
        ]
    },
    {
        "product_name": "Sony A7 IV Mirrorless Camera",
        "product_thumbnail": "https://example.com/sonya7iv.jpg",
        "product_description": "High-performance mirrorless camera with 33MP sensor.",
        "product_price": 2499.99,
        "product_stock": 12,
        "category": "67c9c927de7f8ec2801605b6", // Máy ảnh
        "product_attributes": {
            "resolution": "33MP",
            "zoom": "Optical Zoom 10x",
            "lens_type": "Full-frame",
            "battery_life": "600 shots",
            "video_resolution": "4K 60fps"
        },
        "variations": [
            {
                "variant_name": "Color",
                "variant_value": "Black",
                "price": 2499.99,
                "stock": 12,
                "sku": "SONY-A7IV-BLACK"
            },
            {
                "variant_name": "Color",
                "variant_value": "Silver",
                "price": 2599.99,
                "stock": 5,
                "sku": "SONY-A7IV-SILVER"
            },
            {
                "variant_name": "Lens",
                "variant_value": "Standard Kit",
                "price": 2499.99,
                "stock": 12,
                "sku": "SONY-A7IV-KIT"
            },
            {
                "variant_name": "Lens",
                "variant_value": "Zoom Lens",
                "price": 2999.99,
                "stock": 6,
                "sku": "SONY-A7IV-ZOOM"
            }
        ]
    }
];

const seedProducts = async () => {
    try {
        for (let productData of products) {
            // Tạo một instance mới của Product
            const product = new Product({
                product_name: productData.product_name,
                product_thumbnail: productData.product_thumbnail,
                product_description: productData.product_description,
                product_price: productData.product_price,
                product_stock: productData.product_stock,
                category: productData.category,
                product_attributes: productData.product_attributes,
                variations: productData.variations
            });

            // Lưu sản phẩm vào cơ sở dữ liệu, middleware sẽ tự động tạo slug
            await product.save();
        }
        console.log("Products added successfully!");
    } catch (error) {
        console.error("Error seeding products:", error);
    } finally {
        mongoose.connection.close();
    }
};

seedProducts();
