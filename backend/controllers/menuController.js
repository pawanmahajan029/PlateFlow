const Menu = require("../models/Menu");

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

module.exports = {
    createMenu,
    getAllMenus,
};
