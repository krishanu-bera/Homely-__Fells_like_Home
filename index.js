if(process.env.NODE_ENV !="production"){
  require('dotenv').config();
}



const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
const mongoose = require('mongoose');

//const app = express();

const  session = require("express-session");
const flash = require("connect-flash");

const methodOverride = require("method-override");
const ejs_mate = require("ejs-mate");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


main().then(()=>{
  console.log("connected to db");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/airbin'); 
}



app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")));
app.use(methodOverride("_method"));
app.engine("ejs",ejs_mate);

const sessionOptions = {
  secret:"myserectCode",
  resave: false,
  saveUninitialized : true,
  cookie:{
    expries: Date.now() + 7 * 24 *60 *60 *1000,
    maxAge:7 * 24 *60 *60 *1000,
    httpOnly : true 
  },
};
//root rought
app.get("/",(req,res)=>{
  res.send("Page not found : 404 ");
});


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
})




const validateListing = (req,res,next)=>{
  let result = listingSchema.validate(req.body);
  console.log(result);
}

const validateReview = (req,res,next)=>{
  let result = listingSchema.validate(req.body);
  console.log(result);
}

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

// app.all("*",(req,res,next)=>{
//   next(new ExpressErr(404,"Page is not found!"));
// });


app.use((err,req,res,next)=>{

  let{status=500,message='somthing went Wrong'} = err;
  res.render("err.ejs");
 // res.status(status).send(message);
  //console.log("Somthing went wrong");
})


app.listen(port,()=>{
  console.log("app is listing on port 8080");
})