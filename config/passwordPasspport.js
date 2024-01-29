const passport = require('passport');
const connectToDB = require("./mongodb");
const { Password} = require("../models/user");
const LocalStrategy = require('passport-local').Strategy;
const validPassword = require('./passwordUtils').validPassword;
connectToDB();


module.exports = function (passport) {
    passport.use(new LocalStrategy({
        usernameField: 'uname',
        passwordField: 'pw'
    },
    (email, password, done) => {

        Password.findOne({ email: email })
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
                let user = await Password.findById(id);
                done(null, user);
            } catch (err) {
                done(err);
            }
        });
    }


// const customFields = {
//     usernameField: 'uname',
//     passwordField: 'pw'
// };

// const verifyCallback = (email, password, done) => {

//     User.findOne({ email: email })
//         .then((user) => {

//             if (!user) { return done(null, false) }
            
//             const isValid = validPassword(password, user.hash, user.salt);
            
//             if (isValid) {
//                 return done(null, user);
//             } else {
//                 return done(null, false);
//             }
//         })
//         .catch((err) => {   
//             done(err);
//         });

// }

// const strategy  = new LocalStrategy(customFields, verifyCallback);

// passport.use(strategy);

// passport.serializeUser((user, done) => {
//     done(null, user.id);
// });

// passport.deserializeUser((userId, done) => {
//     User.findById(userId)
//         .then((user) => {
//             done(null, user);
//         })
//         .catch(err => done(err))
// });
