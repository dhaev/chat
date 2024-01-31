const LocalStrategy = require('passport-local').Strategy;
const validPassword = require('./passwordUtils').validPassword;
const { User} = require("../models/user");

module.exports = function (passport) {
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'pw'
    },
    (email, password, done) => {

        User.findOne({ email: email })
            .then((user) => {
    
                if (!user) { return done(null, false) }
                
                const isValid = validPassword(password, user.hash, user.salt);
                
                if (isValid) {
                    return done(null, user);
                } else {
                    return done(null, false);
                }
            })
            .catch((err) => {   
                done(err);
            })}
        ))
    
        passport.serializeUser((user, done) => {
            done(null, user.id);
          });
          
          passport.deserializeUser(async (id, done) => {
            try {
                let user = await User.findById(id);
                done(null, user);
            } catch (err) {
                done(err);
            }
        });
    }
