module.exports = {
    apps: [
      {
        name: "viettech-api",
        script: "server.js", // hoặc app.js nếu bạn dùng tên khác
        env: {
          NODE_ENV: "dev",
          PORT: 3056,
          MONGO_URI: "mongodb+srv://duongdvph46500:duongdvph46500@cluster0.xp55t.mongodb.net/viettech?retryWrites=true&w=majority&appName=Cluster0",
  
          SMTP_USER: "noreply.viettech@gmail.com",
          SMTP_PASS: "xprz clhd kuwg ytjo",
  
          DEV_APP_PORT: 3052,
          DEV_DB_HOST: "localhost",
          DEV_DB_PORT: 27017,
          DEV_DB_NAME: "shopDEV",
  
          PRO_APP_PORT: 3000,
          PRO_DB_HOST: "localhost",
          PRO_DB_PORT: 27017,
          PRO_DB_NAME: "shopPRO"
        }
      }
    ]
  };
  