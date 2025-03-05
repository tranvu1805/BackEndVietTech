const JWT = require("jsonwebtoken");
const createToKenPair = async (payload, publicKey, privateKey) => {
  try {
    const accessToken = await JWT.sign(payload, publicKey, {
      expiresIn: "2 days",
    });
    const represhToken = await JWT.sign(payload, privateKey, {
      expiresIn: "7 days",
    });

    JWT.verify(accessToken, publicKey, (err, decode) => {
      if (err) {
        console.error("err verify::", err);
      } else {
        console.log("decode verify::", decode);
      }
    });
    return { accessToken, represhToken };
  } catch (error) {}
};
module.exports = {
  createToKenPair,
};
