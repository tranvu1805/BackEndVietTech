"use strict";
const mongoose = require("mongoose");
require("dotenv").config();
const dbUrl = process.env.MONGO_URI;

class Database {
  constructor() {
    this.connect();
  }

  connect() {
    // Bật debug mode nếu cần
    mongoose.set("debug", true);
    mongoose.set("debug", { color: true });

    // Kết nối MongoDB Atlas
    mongoose
      .connect(dbUrl)
      .then(() => console.log("✅ Connected to MongoDB VietTech successfully!"))
      .catch((err) => console.error("❌ Could not connect to MongoDB VietTech", err));
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

// Khởi tạo instance
const instanceMongoDb = Database.getInstance();
module.exports = instanceMongoDb;
