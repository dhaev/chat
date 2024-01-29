const express = require('express');
const router = express.Router();
const { User } = require("../models/user");
const { ensureAuth, ensureGuest } = require('../middleware/auth')

router.get('/', ensureGuest, (req,res) =>res.render('login')
  );

router.get('/login', ensureGuest, (req,res) =>{res.render('login')}
  );
   
router.get('/signup', ensureGuest,  (req,res) =>{res.render('signup')}
  );
     
router.get('/dashboard', ensureAuth, async (req,res) => {
  try{ 
      console.log( req.user);
      const conversations = await User.findOne({ 
        _id: req.user.id 
      }, 'contacts').populate('contacts', 'displayName'
      ).lean();
    //  //console.log(conversations.contacts);
      
      res.render('dashboard',{
       name: req.user,
       conversations:conversations.contacts
      })

  } catch(err){
    //console.log("enccountered error displaying conversations");
  }
  
});

module.exports = router;