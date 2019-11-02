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


router.get('/updateRound', ensureAuthenticated, function (req, res) {
  const sql = 'Select * from period order by ay desc, sem desc, round desc limit 1';

  var nextYr;
  var nextSem;
  var nextRound;

  pool.query(sql, (error, result) => {
    if (error) {
      console.log('err: ', error);
    } else {
      var ay = result.rows[0].ay;
      var sem = result.rows[0].sem;
      var round = result.rows[0].round;
      if (round < 3) {
        nextYr = ay;
        nextSem = sem;
        nextRound = (round + 1);
      }
      else {
        if (sem == 1) {
          nextYr = ay;
          nextSem = 2;
          nextRound = 0;
        }
        else {
          var year1 = ay.substring(3, 5);
          var year2 = Number(year1) + 1;
          nextYr = year1 + "/" + year2;
          nextSem = 1;
          nextRound = 0;
        }
      }
      res.render('updateRound', {
        ayround: result.rows[0],
        nextyr: nextYr,
        nextsem: nextSem,
        nextround: nextRound
      })
    }
  });
});

router.post('/proceedNextRound/:year1/:year2/:sem/:round', ensureAuthenticated, function (req, res) {
  const sql = 'INSERT INTO Period VALUES($1, $2, $3);';
  const sql2 = 'UPDATE student s SET year = s.year + 1';
  var nextYear = req.params.year1 + "/" + req.params.year2;
  var nextSem = req.params.sem;
  var nextRound = req.params.round;
  params = [nextYear, nextSem, nextRound];

  pool.query(sql, params, (error, result) => {
    if (error) {
      console.log('err: ', error);
    } else {
      if (nextSem == 1 && nextRound == 0) {
        pool.query(sql2, (error, result2) => {
          if (error) {
            console.log('err: ', error);
          } else {
            res.redirect('/users/updateRound')
          }
        });
      }
      res.redirect('/users/updateRound')
    }
  });
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
  const params = [req.user.nusnetid];

  pool.query(sql, params, (error, result) => {

    if (error) {
      console.log('err: ', error);
    } else {
      res.render('studentInfo', {
        student: result.rows,
      })
    }
  });
});

router.get('/viewAllStudents', ensureAuthenticated, function (req, res) {
  const sql = 'Select u.nusnetid, u.fname, u.lname, s.year, m.majorname , m.faculty from student s inner join users u on s.nusnetid = u.nusnetid inner join major m on m.majorName = s.course';

  pool.query(sql, (error, result) => {

    if (error) {
      console.log('err: ', error);
    } else {
      res.render('viewAllStudents', {
        students: result.rows,
      })
    }
  });
});

router.post('/searchStudent', ensureAuthenticated, function (req, res) {
  const sql = "Select u.nusnetid, u.fname, u.lname, s.year, m2.majorName, m2.faculty from student s inner join users u on s.nusnetid = u.nusnetid inner join major m2 on m2.majorName = s.course Where ((LOWER(u.nusnetid) LIKE '%' || $1 ||'%') OR (LOWER(CONCAT(u.fname,' ',u.lname)) LIKE '%' || $1|| '%'))";
  var searchedValue = req.body.searchedValue;
  const params = [searchedValue.toLowerCase()];

  pool.query(sql, params, (error, result) => {

    if (error) {
      console.log('err: ', error);
    } else {
      res.render('viewAllStudents', {
        students: result.rows,
        searchedValue: searchedValue,
        user: req.user
      })
    }
  });
});

router.post('/viewStudentDetails/:nusnetid', ensureAuthenticated, function (req, res) {
  const sql = 'SELECT u.fname, u.lname ,s.*, m1.majorname as secondmajor ,m2.faculty, m3.minorName, d.specializationName FROM student s INNER JOIN users u on u.nusnetid=s.nusnetid INNER JOIN major m2 ON s.course = m2.majorName LEFT JOIN minoring m3 on s.nusnetid = m3.nusnetid LEFT JOIN declared d on d.nusnetid = s.nusnetid LEFT JOIN (Select * FROM majoring m WHERE m.nusnetid = $1 AND m.majorname not in (select course from student where nusnetid = $1)) as m1 on m1.nusnetid = s.nusnetid WHERE s.nusnetid = $1';
  const params = [req.params.nusnetid];

  pool.query(sql, params, (error, result) => {
    if (error) {
      console.log('err: ', error);
    } else {
      res.render('viewStudentDetail', {
        student: result.rows[0],
        user: req.user
      })
    }
  });
});



module.exports = router;
