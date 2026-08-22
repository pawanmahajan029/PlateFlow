const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");


const userRoutes = require("./routes/userRoutes");
const menuRoutes = require("./routes/menuRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get("/", (req, res) => {
    res.send("API is Running...");
});


app.use("/api/users", userRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);

module.exports = app;
