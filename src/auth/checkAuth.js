const { permission } = require("process");
const { findById } = require("../services/apikey.service");

const HEADER = {
  API_KEY: "x-api-key",
  AUTHORIZATION: "authorization",
};

const apiKey = async (req, res, next) => {
  try {
    const key = req.headers[HEADER.API_KEY]?.toString();

    console.log("check key",key);
    

    if (!key) {
      return res.status(403).json({
        message: "Forbidden Error",
      });
    }
    //check objkey
    const objKey = await findById(key);
    if (!objKey) {
      return res.status(403).json({
        message: "Forbidden Error",
      });
    }
    req.objKey = objKey;
    return next();
  } catch (error) {}
};

const permissions = (permission) => {
  return (req, res, next) => {
    if (!req.objKey.permissions) {
      return res.status(403).json({
        message: "permission denied",
      });
    }
    console.log("permissions::", req.objKey.permissions);
    const validPermission = req.objKey.permissions.includes(permission);
    if (!validPermission) {
      return res.status(403).json({
        message: "permission denied",
      });
    }
    return next();
  };
};

const asyncHandler = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

module.exports = {
  apiKey,
  permissions,
  asyncHandler,
};
