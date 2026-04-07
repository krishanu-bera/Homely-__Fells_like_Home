const Listing = require("../models/listings");
const Booking = require("../models/booking");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const { CATEGORIES, inferCategory, inferGuestCount } = require("../utils/listingMeta");

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

function buildDefaultImage() {
  return {
    url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
    filename: "default-listing-image",
  };
}

function buildGallery(files = []) {
  if (!files.length) {
    const fallback = buildDefaultImage();
    return [fallback];
  }

  return files.map((file) => ({
    url: file.path,
    filename: file.filename,
  }));
}

function sanitizeGallery(gallery = []) {
  return gallery.length ? gallery : [buildDefaultImage()];
}

async function geocodeLocation(location) {
  const response = await geocodingClient.forwardGeocode({
    query: location,
    limit: 1,
  }).send();

  return response.body.features?.[0]?.geometry || null;
}

function buildListingData(reqBodyListing, reqFiles, ownerId, geometry) {
  const category = reqBodyListing.category || inferCategory(reqBodyListing);
  const maxGuests = Number(reqBodyListing.maxGuests) || inferGuestCount({ ...reqBodyListing, category });
  const gallery = sanitizeGallery(buildGallery(reqFiles));
  const newListing = new Listing(reqBodyListing);

  newListing.owner = ownerId;
  newListing.category = category;
  newListing.maxGuests = maxGuests;
  newListing.image = gallery[0];
  newListing.gallery = gallery;
  newListing.geometry = geometry;
  return newListing;
}

function buildFilterQuery(query = {}) {
  const filters = {};
  const { q, country, location, category, guests, minPrice, maxPrice } = query;

  if (q) {
    const regex = new RegExp(q, "i");
    filters.$or = [
      { title: regex },
      { description: regex },
      { location: regex },
      { country: regex },
    ];
  }

  if (country) {
    filters.country = new RegExp(`^${country}$`, "i");
  }

  if (location) {
    filters.location = new RegExp(location, "i");
  }

  if (category) {
    filters.category = category;
  }

  if (guests) {
    filters.maxGuests = { $gte: Number(guests) };
  }

  if (minPrice || maxPrice) {
    filters.price = {};
    if (minPrice) filters.price.$gte = Number(minPrice);
    if (maxPrice) filters.price.$lte = Number(maxPrice);
  }

  return filters;
}

function normalizeFilters(query = {}) {
  return {
    q: query.q || "",
    country: query.country || "",
    location: query.location || "",
    category: query.category || "",
    guests: query.guests || "",
    minPrice: query.minPrice || "",
    maxPrice: query.maxPrice || "",
  };
}

function getDateLabel(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

module.exports.home = async (req, res) => {
  const featuredListings = await Listing.find({})
    .sort({ createdAt: -1, _id: -1 })
    .limit(6);

  const categoryCards = CATEGORIES.map((category) => ({
    name: category,
    href: `/listings?category=${encodeURIComponent(category)}`,
  }));

  const destinationStats = await Listing.aggregate([
    {
      $group: {
        _id: "$location",
        count: { $sum: 1 },
        country: { $first: "$country" },
      },
    },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 4 },
  ]);

  res.render("listings/home.ejs", {
    featuredListings,
    categoryCards,
    destinationStats,
    filters: normalizeFilters(req.query),
  });
};

module.exports.index = async (req, res) => {
  const filters = normalizeFilters(req.query);
  const query = buildFilterQuery(req.query);
  const all = await Listing.find(query).sort({ _id: -1 });

  res.render("listings/index.ejs", {
    all,
    filters,
    categories: CATEGORIES,
  });
};

module.exports.apiIndex = async (req, res) => {
  const listings = await Listing.find(buildFilterQuery(req.query))
    .populate("owner", "username email")
    .populate({
      path: "reviews",
      select: "rating comment author createdAt",
      populate: {
        path: "author",
        select: "username",
      },
    });

  res.json({ listings });
};

module.exports.apiCreate = async (req, res) => {
  const payload = req.body.listing || req.body;
  let geometry;

  try {
    geometry = await geocodeLocation(payload.location);
  } catch (err) {
    return res.status(502).json({
      error: "Location lookup failed. Please verify your map configuration and try again.",
    });
  }

  if (!geometry) {
    return res.status(400).json({
      error: "Please enter a valid location.",
    });
  }

  const newListing = buildListingData(payload, req.files || [], req.user._id, geometry);
  await newListing.save();

  const listing = await Listing.findById(newListing._id).populate("owner", "username email");
  return res.status(201).json({
    message: "New listing created successfully.",
    listing,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs", { categories: CATEGORIES });
};

module.exports.show = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing does not exist!");
    return res.redirect("/listings");
  }

  const upcomingBookings = await Booking.find({
    listing: listing._id,
    status: "confirmed",
    checkOut: { $gte: new Date() },
  })
    .sort({ checkIn: 1 })
    .limit(4)
    .populate("guest", "username");

  const bookings = upcomingBookings.map((booking) => ({
    ...booking.toObject(),
    dateLabel: `${getDateLabel(booking.checkIn)} - ${getDateLabel(booking.checkOut)}`,
  }));

  res.render("listings/show.ejs", {
    listing,
    bookings,
  });
};

module.exports.create = async (req, res) => {
  let geometry;

  try {
    geometry = await geocodeLocation(req.body.listing.location);
  } catch (err) {
    req.flash("error", "Location lookup failed. Please verify your map configuration and try again.");
    return res.redirect("/listings/new");
  }

  if (!geometry) {
    req.flash("error", "Please enter a valid location.");
    return res.redirect("/listings/new");
  }

  const newListing = buildListingData(req.body.listing, req.files || [], req.user._id, geometry);
  await newListing.save();

  req.flash("success", "New listing created!");
  res.redirect(`/listings/${newListing._id}`);
};

module.exports.edit = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing does not exist!");
    return res.redirect("/listings");
  }

  const gallery = sanitizeGallery(listing.gallery?.length ? listing.gallery : [listing.image].filter(Boolean));
  res.render("listings/edit.ejs", {
    listing,
    categories: CATEGORIES,
    gallery,
  });
};

module.exports.update = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing does not exist!");
    return res.redirect("/listings");
  }

  let geometry = listing.geometry;
  if (req.body.listing.location !== listing.location) {
    try {
      geometry = await geocodeLocation(req.body.listing.location);
    } catch (err) {
      req.flash("error", "Location lookup failed. Please verify your map configuration and try again.");
      return res.redirect(`/listings/${id}/edit`);
    }

    if (!geometry) {
      req.flash("error", "Please enter a valid location.");
      return res.redirect(`/listings/${id}/edit`);
    }
  }

  listing.title = req.body.listing.title;
  listing.description = req.body.listing.description;
  listing.price = req.body.listing.price;
  listing.location = req.body.listing.location;
  listing.country = req.body.listing.country;
  listing.category = req.body.listing.category || inferCategory(req.body.listing);
  listing.maxGuests = Number(req.body.listing.maxGuests) || listing.maxGuests || inferGuestCount(listing);
  listing.geometry = geometry;

  if ((req.files || []).length) {
    const gallery = sanitizeGallery(buildGallery(req.files));
    listing.gallery = gallery;
    listing.image = gallery[0];
  } else {
    listing.gallery = sanitizeGallery(listing.gallery?.length ? listing.gallery : [listing.image].filter(Boolean));
    listing.image = listing.gallery[0];
  }

  await listing.save();

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.delete = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};
