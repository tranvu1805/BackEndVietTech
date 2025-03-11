const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();
const path = require("path");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


// console.log(`Process::`,process.env);
app.use(express.json()); // 🛠 Middleware giúp đọc request body JSON
app.use(express.urlencoded({ extended: true })); // 🛠 Hỗ trợ form-data
app.use("/", require("./src/routes/index"));



// init middlewares
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
// morgan("combined")
// morgan("common")
// morgan("short")
// morgan("tiny")

//init db
require("./src/dbs/init.mongodb");
// const {checkOverload }=require('./src/helpers/check.connect')
// checkOverload ()
// //init routes
app.use('/',require('./src/routes/index'))
const shopRoutes = require("./src/routes/");
const productRoutes = require("./src/routes/shop/product.route");
// app.use("/admin", productRoutes);
app.use("/api", shopRoutes);
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
