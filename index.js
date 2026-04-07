if(process.env.NODE_ENV !="production"){
  require('dotenv').config();
  
}

const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
const mongoose = require('mongoose');

const session = require("express-session");
const flash = require("connect-flash");

const methodOverride = require("method-override");
const ejs_mate = require("ejs-mate");

const listingRouter = require("./routes/listing.js");
const bookingRouter = require("./routes/booking.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const listingController = require("./controllers/listings.js");
const { isApiLoggedIn, isLoggedin, validateApiListing } = require("./middleware.js");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const ExpressErr = require("./utils/ExpressErr.js");
const wrapAsync = require("./utils/wrapAsync.js");
const dbUrl = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/airbnb";
const sessionSecret = process.env.SESSION_SECRET || "mySecretCode";

main().then(()=>{
  console.log("connected to db");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(dbUrl); 

}



app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")));
app.use(methodOverride((req) => {
  if (req.body && typeof req.body === "object" && "_method" in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }

  if (req.query && typeof req.query._method === "string") {
    return req.query._method;
  }
}));
app.engine("ejs",ejs_mate);

const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized : true,
  cookie:{
    expires: Date.now() + 7 * 24 *60 *60 *1000,
    maxAge:7 * 24 *60 *60 *1000,
    httpOnly : true
  },
};
app.get("/Api",(req,res)=>{
  res.send("Hii I am an http get Api");
})


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
});

//root route
app.get("/", wrapAsync(listingController.home));

app.get("/api/listings", listingController.apiIndex);
app.post("/api/listings", wrapAsync(isApiLoggedIn), validateApiListing, wrapAsync(listingController.apiCreate));
app.get("/listings/api", listingController.apiIndex);
app.post("/listings/api", wrapAsync(isApiLoggedIn), validateApiListing, wrapAsync(listingController.apiCreate));
app.use("/listings", listingRouter);
app.use("/listings/:id/bookings", bookingRouter);
app.use("/listings/:listingId/reviews", reviewRouter);
app.use("/", userRouter);

app.use((req,res,next)=>{
  next(new ExpressErr(404,"Page is not found!"));
});

app.use((err,req,res,next)=>{
  console.error(err);
  let{status=500,message='something went wrong'} = err;
  const isApiRequest = req.originalUrl.startsWith("/api/");
  if (isApiRequest) {
    return res.status(status).json({ error: message });
  }
  res.status(status).render("err.ejs", {message});
});

app.listen(port,()=>{
  console.log("app is listening on port 8080");
});
