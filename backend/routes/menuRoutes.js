const express = require("express");

const router = express.Router();

const {
    createMenu,
    getAllMenus,
    updateMenuAvailability,
} = require("../controllers/menuController");

const protect = require("../middleware/authmiddleware");

const authorize = require("../middleware/rolemiddleware");

router.get("/", getAllMenus);

router.post("/", protect, authorize("admin", "superAdmin"), createMenu);

// Operator can update menu item availability
router.put("/:id/availability",protect,authorize("operator"),updateMenuAvailability);

module.exports = router;