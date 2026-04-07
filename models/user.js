const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocal = require("passport-local-mongoose");

const userSchema = new Schema({
    email:{
        type: String,
        required: true
    }
});

userSchema.plugin(passportLocal);

module.exports =mongoose.model('User', userSchema);
