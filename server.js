const app = require("./app");
require("dotenv").config();
const connectDB = require("./src/config/db");

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, (req, res) => {
      console.log(`Server is running at port ${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err.message);
  });

