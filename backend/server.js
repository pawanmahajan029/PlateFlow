// Initialize environment variables and server dependencies
require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");


// Connect MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});