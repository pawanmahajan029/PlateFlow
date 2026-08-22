require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/user");

const deleteSuperAdmin = async () => {
    try {
        await connectDB();
        const res = await User.deleteMany({ role: "superAdmin" });
        console.log(`✅ Deleted ${res.deletedCount} superAdmin documents from MongoDB.`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error deleting superAdmin:", error);
        process.exit(1);
    }
};

deleteSuperAdmin();
