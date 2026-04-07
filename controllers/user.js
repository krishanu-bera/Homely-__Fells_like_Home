const User = require("../models/user.js");

module.exports.signupRender = (req,res)=>{
    res.render("users/signup.ejs");
}

module.exports.signup = async(req,res,next)=>{
    try{
        let{username,email,password} = req.body;
        const newUser = new User({email,username});
        const registerUser = await User.register(newUser,password);
        req.login(registerUser,(err)=>{
            if(err){
                return next(err);
            }
            req.flash("success","welcome to Airbnb");
            res.redirect("/listings");
        })
       
    }catch(err){
        req.flash("error",err.message);
        res.redirect("/signup");
    }
}

module.exports.loginRender = (req,res)=>{
    res.render("users/login.ejs");
}

module.exports.login = async(req, res) => {
    const redirectUrl = req.session.redirectUrl || "/listings";
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
}

module.exports.logout = (req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","you are logged out now");
        res.redirect("/listings");
    })
}
