const express = require('express')
const morgan = require('morgan')
const helmet = require('helmet')
const compression = require('compression')
require('dotenv').config()

const app = express()

// console.log(`Process::`,process.env);
app.use(express.json()); // 🛠 Middleware giúp đọc request body JSON
app.use(express.urlencoded({ extended: true })); // 🛠 Hỗ trợ form-data

// init middlewares
app.use(morgan("dev"))
app.use(helmet())
app.use(compression())
// morgan("combined")
// morgan("common")
// morgan("short")
// morgan("tiny")

//init db
require('./src/dbs/init.mongodb')
// const {checkOverload }=require('./src/helpers/check.connect')
// checkOverload ()
// //init routes
app.use('/',require('./src/routes/index'))
//handing error
module.exports = app