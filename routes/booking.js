const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync");
const bookingController = require("../controllers/bookings");
const { isLoggedin, validateBooking } = require("../middleware");

router.post("/", isLoggedin, validateBooking, wrapAsync(bookingController.create));

module.exports = router;
