const Menu = require("../models/Menu");

//createMenu
const createMenu = async (req, res) => {
    try {

        const {
            name,
            description,
            price,
            category,
            image,
            isVeg,
            isAvailable,
            preparationTime,
        } = req.body;

        const menuItem = await Menu.create({
            name,
            description,
            price,
            category,
            image,
            isVeg,
            isAvailable,
            preparationTime,
        });

        res.status(201).json({
            success: true,
            message: "Menu item created successfully",
            menuItem,
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });

    }
};

// to get full menu
const getAllMenus = async (req, res) => {
    try {

        const menuItems = await Menu.find();

        res.status(200).json({
            success: true,
            count: menuItems.length,
            menuItems,
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });

    }
};

// Operator can update menu item availability
const updateMenuAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    // Check if availability value is provided
    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isAvailable must be true or false",
      });
    }

    // Find menu item
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Update availability
    menu.isAvailable = isAvailable;

    await menu.save();

    res.status(200).json({
      success: true,
      message: "Menu availability updated successfully",
      menu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
    createMenu,
    getAllMenus,
    updateMenuAvailability,
};
