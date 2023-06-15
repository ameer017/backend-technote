const express = require("express");
const router = express.Router();
const loginLimiter = require("../middleware/loginLimiter");
const authConroller = require("../controllers/authController");

router.route("/").post(loginLimiter, authConroller.login);

router.route("/refresh").get(authConroller.refresh);

router.route("/logout").post(authConroller.logout);

module.exports = router;