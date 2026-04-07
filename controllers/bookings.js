const Booking = require("../models/booking");
const Listing = require("../models/listings");

function calculateNights(checkIn, checkOut) {
  const msInDay = 24 * 60 * 60 * 1000;
  return Math.ceil((checkOut - checkIn) / msInDay);
}

module.exports.create = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing does not exist!");
    return res.redirect("/listings");
  }

  if (listing.owner && listing.owner.equals(req.user._id)) {
    req.flash("error", "You cannot book your own listing.");
    return res.redirect(`/listings/${id}`);
  }

  const checkIn = new Date(req.body.booking.checkIn);
  const checkOut = new Date(req.body.booking.checkOut);
  const guests = Number(req.body.booking.guests);

  if (guests > listing.maxGuests) {
    req.flash("error", `This stay allows up to ${listing.maxGuests} guests.`);
    return res.redirect(`/listings/${id}`);
  }

  const overlappingBooking = await Booking.findOne({
    listing: listing._id,
    status: "confirmed",
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });

  if (overlappingBooking) {
    req.flash("error", "Those dates are already booked. Please choose different dates.");
    return res.redirect(`/listings/${id}`);
  }

  const nights = calculateNights(checkIn, checkOut);
  const totalPrice = nights * listing.price;

  await Booking.create({
    listing: listing._id,
    guest: req.user._id,
    checkIn,
    checkOut,
    guests,
    nights,
    totalPrice,
  });

  req.flash("success", "Booking confirmed successfully.");
  res.redirect(`/listings/${id}`);
};
