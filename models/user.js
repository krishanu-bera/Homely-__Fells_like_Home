const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocal = require("passport-local-mongoose");

const userSchema = new Schema({
    email:{
        type: String,
        require: true
    }
});

userSchema.plugin(passportLocal);

module.exports =mongoose.model('User', userSchema);
