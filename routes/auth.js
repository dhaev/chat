const express = require('express');
const passport = require('passport');
const router = express.Router();
const { User} = require("../models/user");

const genPassword = require('../config/passwordUtils').genPassword;

router.get('/google',
  passport.authenticate('google', { scope: ['profile'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/dashboard');
  });

  router.get('/logout', (req, res, next) => {
    req.logout((error) => {
        if (error) {return next(error)}
        res.redirect('/');
    });
  })
  
//=====================LOCAL===============================

router.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/dashboard');
  });
// router.post('/login', passport.authenticate('local', { failureRedirect: '/', successRedirect: '/dashboard' }));

router.post('/signup', (req, res, next) => {
  console.log("body =  "+ req)
  console.log("body =  "+ req.body.pw)
  const saltHash = genPassword(req.body.pw);
  
  const salt = saltHash.salt;
  const hash = saltHash.hash;

  const newUser = new User({
      email: req.body.uname, // changed 'uname' to 'username'
      hash: hash,
      salt: salt,
  });

  newUser.save()
      .then((user) => {
          console.log(user);
          res.redirect('/login');
      })
      .catch((error) => {
          console.error(error);
          // handle error, maybe redirect to an error page
      });
});


module.exports = router;