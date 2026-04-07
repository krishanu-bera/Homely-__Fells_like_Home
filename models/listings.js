const mongoose = require("mongoose");
const Review = require("./review");
const Booking = require("./booking");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    url:String,
    filename:String,
  },
  gallery: [
    {
      url: String,
      filename: String,
    }
  ],
  price: Number,
  location: String,
  country: String,
  category: {
    type: String,
    default: "Luxury",
  },
  maxGuests: {
    type: Number,
    default: 2,
    min: 1,
  },
  reviews:[
    {
      type:Schema.Types.ObjectId,
      ref:"Review"
    }
  ],
  owner : {
    type:Schema.Types.ObjectId,
    ref:"User",
  },
  geometry:{
     type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
    },
    coordinates: {
      type: [Number],
    }
  }
  
});

listingSchema.post("findOneAndDelete",async(listing)=>{
  if(listing){
    await Review.deleteMany({ _id: { $in: listing.reviews } });
    await Booking.deleteMany({ listing: listing._id });
  }
  

})

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
