const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const { env } = require("process");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


const filePath = path.join(__dirname, "public", "OneSignalSDKWorker.js");
if (fs.existsSync(filePath)) {
  console.log("✅ File OneSignalSDKWorker.js tồn tại và sẽ được serve!");
} else {
  console.log("❌ File không tồn tại:", filePath);
}

app.use(cookieParser());
// console.log(`Process::`,process.env);
app.use(express.json()); // 🛠 Middleware giúp đọc request body JSON
app.use(express.urlencoded({ extended: true })); // 🛠 Hỗ trợ form-data




// init middlewares
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
// morgan("combined")
// morgan("common")
// morgan("short")
// morgan("tiny")
const productRoutes = require("./src/routes/shop/product.route");
const shopRoutes = require("./src/routes/");

//init db
require("./src/dbs/init.mongodb");

app.use('/', require('./src/routes/index'))
app.use("/admin", productRoutes);
// app.use("/api", shopRoutes);



//handing error
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});
// app.use((error, req, res, next) => {
//   const statusCode = error.status || 500;
//   return res.status(statusCode).json({
//     error: {
//       status: "error",
//       code: statusCode,
//       message: error.message || "Internal Server Error",
//     },
//   });
// });


module.exports = app;
