const app = require("./app");

const PORT = process.env.PORT || 3060;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/v1/api/`);

});
