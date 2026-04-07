const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        country: Joi.string().required(),
        location: Joi.string().required(),
        price: Joi.number().required().min(0),
        image: Joi.string().allow("", null),
        category: Joi.string().valid("Luxury", "Beach", "City", "Pool", "Romantic", "Skyline").optional(),
        maxGuests: Joi.number().min(1).optional()
    }).required()
});

module.exports.reviewsSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().max(5).min(1),
        comment: Joi.string().required(),
    }).required(),
});

module.exports.bookingSchema = Joi.object({
    booking: Joi.object({
        checkIn: Joi.date().required(),
        checkOut: Joi.date().greater(Joi.ref("checkIn")).required(),
        guests: Joi.number().min(1).required(),
    }).required(),
});
