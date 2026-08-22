const express = require("express");

const router = express.Router();

const {
    createMenu,
    getAllMenus,
} = require("../controllers/menuController");

const protect = require("../middleware/authmiddleware");

const authorize = require("../middleware/rolemiddleware");

router.get("/", getAllMenus);

router.post("/", protect, authorize("admin", "superAdmin"), createMenu);

module.exports = router;