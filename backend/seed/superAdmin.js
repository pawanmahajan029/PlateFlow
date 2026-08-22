require("dotenv").config();

const connectDB = require("../config/db");
const User = require("../models/user");

const createSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Check required environment variables
        if (
            !process.env.SUPER_ADMIN_NAME ||
            !process.env.SUPER_ADMIN_EMAIL ||
            !process.env.SUPER_ADMIN_PHONE ||
            !process.env.SUPER_ADMIN_PASSWORD
        ) {
            console.log("❌ Missing Super Admin environment variables.");
            process.exit(1);
        }

        // Delete any existing Super Admin to allow clean re-seeding
        await User.deleteMany({ role: "superAdmin" });

        // Create Super Admin
        const superAdmin = new User({
            fullName: process.env.SUPER_ADMIN_NAME,
            email: process.env.SUPER_ADMIN_EMAIL,
            phone: process.env.SUPER_ADMIN_PHONE,
            password: process.env.SUPER_ADMIN_PASSWORD,
            role: "superAdmin",
        });

        await superAdmin.save();

        console.log("✅ Super Admin created successfully.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error creating Super Admin:");
        console.error(error);
        process.exit(1);
    }
};

createSuperAdmin();