const express = require("express");
const app = express();
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");

app.use(morgan("combined"));
app.use(helmet());
app.use(compression());

//init db
require("./dbs/init.mongo");

//init routes
app.get("/", (req, res, next) => {
  const data = "hello world";
  return res.status(200).json({
    message: "Welcome to the shop",
  });
});

module.exports = app;
