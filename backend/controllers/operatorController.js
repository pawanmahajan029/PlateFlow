const User = require("../models/user");

// Get Operator Profile
const getOperatorProfile = async (req, res) => {
  try {
    const operator = await User.findById(req.user.id).select("-password");

    if (!operator) {
      return res.status(404).json({
        success: false,
        message: "Operator not found",
      });
    }

    res.status(200).json({
      success: true,
      operator,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Create Chef
const createChef = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const emailExists = await User.findOne({ email });

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already exists.",
      });
    }

    const phoneExists = await User.findOne({ phone });

    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists.",
      });
    }

    const chef = await User.create({
      fullName,
      email,
      phone,
      password,
      role: "chef",
    });

    res.status(201).json({
      success: true,
      message: "Chef created successfully",
      chef: {
        id: chef._id,
        fullName: chef.fullName,
        email: chef.email,
        phone: chef.phone,
        role: chef.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  getOperatorProfile,
  createChef,
};