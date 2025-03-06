"use strict";

const findByEmail = async ({
  email,
  select = {
    email: 1,
    password: 1,
    role_id: 1,
    username: 1,
    full_name: 1,
    phone: 1,
    address: 1,
  },
}) => {
  return await accountModel.findOne({ email }).select(select).lean();
};
module.exports = { findByEmail };
