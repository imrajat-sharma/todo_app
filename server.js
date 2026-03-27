require("dotenv").config();

const app = require("./app");
const connectDB = require("./src/config/db");

const PORT = Number(process.env.PORT) || 3000;

const bootstrap = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start application:", error.message);
    process.exit(1);
  }
};

bootstrap();
