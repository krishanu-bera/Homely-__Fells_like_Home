const { model } = require("mongoose");
const Listing = require("../models/listings.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;

const geocodingClient= mbxGeocoding({ accessToken: mapToken });

module.exports.index = async(req,res)=>{
  const all = await Listing.find({});
  res.render("listings/index.ejs",{all});
}

module.exports.renderNewForm = (req,res)=>{
 
  res.render("listings/new.ejs");
}

module.exports.show = async (req,res)=>{
  let {id} =  req.params;
  const listing = await Listing.findById(id)
  .populate({path:"reviews",
    populate:{
      path:"author",
    }

  })
  .populate("owner");
  if(!listing){
    req.flash("error","Listing does not exist!");
    return res.redirect("/listings");
  }
  
  res.render("listings/show.ejs",{listing});
}




module.exports.create  = async (req, res, next) => {
  let response = await geocodingClient.forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
  })
  .send();
  
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  
  if (req.file) {
    newListing.image = { url: req.file.path, filename: req.file.filename };
  }

  newListing.geometry = response.body.features[0].geometry;
  await newListing.save();
  
  req.flash("success", "New Listing Created!");
  res.redirect(`/listings`);
}


module.exports.edit = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
   if(!listing){
    req.flash("error","Listing does not exist!");
    res.redirect("/listings");
  }
  let originalImg =  listing.image.url;
   //originalImg = originalImg.replace("/uplode","/uplode/h_300,w_250/e_blur:300");
   originalImg = originalImg.replace("/upload", "/upload/h_300,w_250/e_blur:300");


  res.render("listings/edit.ejs", { listing,originalImg});
}

module.exports.update = async (req, res) => {
  let { id } = req.params;

  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if(typeof req.file !=="undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {url,filename};
    await listing.save();
  }
  
  req.flash("success","Listing Updated!");
  res.redirect(`/listings/${id}`);
}
module.exports.delete = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  req.flash("success","Listing  Deleted!");
  //console.log(deletedListing);
  res.redirect("/listings");
}