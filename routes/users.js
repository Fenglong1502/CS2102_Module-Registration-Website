const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const ensureAuthenticated = require('../ensureAuthenticated');
const passport = require('passport');
const pool = require('../database');
require('../passport')(passport);


//Redirect to Register User (Testing Purpose)
router.get('/insertUser', function (req, res) {
  res.render('insertUser');
});


//Create user (Testing Purpose)
router.post("/insertUser", (req, res) => {
  var nusnetID = req.body.nusnetID;
  var fname = req.body.fname;
  var lname = req.body.lname;
  var password = req.body.password;
  var userType = req.body.userType;

  var year = req.body.year;
  var moduleCredit = req.body.moduleCredit;

  bcrypt.hash(password, 10, function (err, hash) {
    if (err) {
      console.log(err);
    }
    const sql = "INSERT INTO users VALUES ($1, $2, $3, $4);";
    const params = [nusnetID, fname, lname, hash];
    console.log("123");
    pool.query(sql, params, (error, result) => {
      if (error) {
        console.log("err: ", error);
      }

      if (userType === "student") {
        const studentSql = "INSERT INTO student VALUES ($1, $2, $3);";
        const studentParams = [nusnetID, year, moduleCredit];
        pool.query(studentSql, studentParams, (studentError, studentResult) => {
          if (studentError) {
            console.log("err: ", studentError);
          }
        });
      }

      if (userType === "admin") {
        const adminSql = "INSERT INTO admin VALUES ($1);";
        const adminParams = [nusnetID];
        pool.query(adminSql, adminParams, (adminError, adminResult) => {
          if (adminError) {
            console.log("err: ", adminError);
          }
        });
      }
      console.log("result?", result);
      res.redirect("/users/login");
    });
  });
});



//Login form
router.get('/login', function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/index");
  }
  res.render('login', { layout: false });
});

//Login process
router.post('/login', function (req, res, next) {
  passport.authenticate('local', {
    successRedirect: '/index',
    failureRedirect: '/appeals/viewAllAppeals',
    failureFlash: true
  })(req, res, next);
});


//Logout
router.get('/logout', function (req, res) {
  req.flash('success', 'You have successfully logged out.')
  req.logout();
  res.redirect('/users/login');
});

router.get('/viewUserProfile', ensureAuthenticated, function (req, res) {
  res.render('viewUserProfile');
});

router.get('/viewStudentInformation', ensureAuthenticated, function (req, res) {
  const sql = 'SELECT s.*, m1.majorName, m2.faculty, m3.minorName, d.specializationName FROM(student s INNER JOIN majoring m1 ON s.nusnetid = m1.nusnetid) INNER JOIN major m2 ON m1.majorName = m2.majorName LEFT JOIN minoring m3 on s.nusnetid = m3.nusnetid LEFT JOIN declared d on d.nusnetid = s.nusnetid WHERE s.nusnetid = $1';
  console.log("HEREREREREREREREREERE");
  console.log(req.user.nusnetid);
  const params = [req.user.nusnetid];

  pool.query(sql,params, (error, result) => {

    if (error) {
      console.log('err: ', error);
    } else {
      res.render('studentInfo', {
        student: result.rows,
      })
    }
  });
});



module.exports = router;
