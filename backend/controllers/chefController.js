const User = require("../models/user");

// Get Chef Profile
const getChefProfile = async (req, res) => {
  try {
    const chef = await User.findById(req.user.id).select("-password");

    if (!chef) {
      return res.status(404).json({
        success: false,
        message: "Chef not found",
      });
    }

    res.status(200).json({
      success: true,
      chef,
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
  getChefProfile,
};