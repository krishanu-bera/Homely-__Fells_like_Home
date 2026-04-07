const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");

const {isLoggedin, isOwner, validateListing} = require("../middleware.js");

//const Listing = require("../models/listings.js");
const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const{storage} = require("../cloudconfig.js");
const upload = multer({storage});

router.route("/")
.get(wrapAsync(listingController.index))
.post(isLoggedin, upload.array("listing[images]", 6), validateListing,
 wrapAsync(listingController.create));

//New Route
router.get("/new",isLoggedin,listingController.renderNewForm);

router.route("/:id")
.get(wrapAsync(listingController.show))
.put(isLoggedin, isOwner, upload.array("listing[images]", 6), validateListing,
    wrapAsync(listingController.update))
.delete(isLoggedin, isOwner, wrapAsync(listingController.delete));

//Edit Route
router.get("/:id/edit",isLoggedin,isOwner,   wrapAsync(listingController.edit));

module.exports = router;
