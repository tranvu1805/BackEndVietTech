"use strict";
const mongoose = require("mongoose");
const {
  db: { host, port, name },
} = require("../configs/configMongoDb");
const dbUrl = `mongodb://${host}:${port}/${name}`;

class Database {
  constructor() {
    this.connect();
  }
  connect(type = "mongodb") {
    if (1 == 1) {
      mongoose.set("debug", true);
      mongoose.set("debug", { color: true });
    }
    mongoose
      .connect(dbUrl)
      .then((_) => console.log("Connected to MongoDB Successfully"))
      .catch((err) => console.error("Could not connect to MongoDB", err));
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}
const instanceMongoDb = Database.getInstance();
module.exports = instanceMongoDb;
