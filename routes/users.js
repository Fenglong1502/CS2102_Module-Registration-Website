const express = require('express');
const router = express.Router();

const pool = require('../database');

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});


//Login form
router.get('/login', function (req, res) {
  // if (req.isAuthenticated()) {
  //     res.redirect("/home");
  // }
  res.render('login', {layout: false});
});

//Login process
router.post('/login', function (req, res, next) {
  passport.authenticate('local', {
    successRedirect: '/home/',
    failureRedirect: '/users/login',
    failureFlash: '<i class="fas fa-times"></i> Username/password combination wrong.'
  })(req, res, next);
});


//Logout
router.get('/logout', function (req, res) {
  req.flash('success', 'You have successfully logged out.')
  req.logout();
  res.redirect('/users/login');
});

router.get('/viewStudentInformation', function (req, res) {
  // if (req.isAuthenticated()) {
  //     res.redirect("/home");
  // }
  res.render('studentInfo');
});


module.exports = router;
