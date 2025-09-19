const Listing = require("./models/listings");
const Review = require("./models/review");
module.exports.isLoggedin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // Save the original URL they were trying to access
        req.session.redirectUrl = req.originalUrl;

        req.flash("error", "You have to login! for further");
        return res.redirect("/login");
    }

    next(); // Allow access to the route if authenticated
};

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}
module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You are not authorized to do that.");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.isAuthor= async (req, res, next) => {
  const { id,reviewId } = req.params;
  const review = await Review.findById(reviewId );
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You are not authorized to do that.");
    return res.redirect(`/listings/${id}`);
  }
  next();
};
