const express = require("express");
const router = express.Router({mergeParams:true});

const wrapAsync = require("../utils/wrapAsync.js");
const ExpressErr = require("../utils/ExpressErr.js");
const Listing = require("../models/listings.js");
const Review = require("../models/review.js");
const {isLoggedin, isAuthor, validateReview} = require("../middleware.js");
const  reviewController = require("../controllers/reviews.js");

router.post("/", isLoggedin, validateReview, wrapAsync(reviewController.createReview));
// delete review
router.delete("/:reviewId", isLoggedin, isAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;
