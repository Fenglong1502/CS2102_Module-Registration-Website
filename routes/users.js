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
        nextRound = (parseInt(round) + 1);
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

function compareSecondColumn(a, b) {
  if (a[2] === b[2]) {
    return 0;
  }
  else {
    return (a[2] > b[2]) ? -1 : 1;
  }
}

router.post('/proceedNextRound/:year1/:year2/:sem/:round', ensureAuthenticated, function (req, res) {
  const sql = 'INSERT INTO Period VALUES($1, $2, $3);';
  const sql2 = 'UPDATE student s SET year = s.year + 1';
  console.log("fadasdgdsagsdgasdgsdgsdgsadgs");
  var ay = req.params.year1 + "/" + req.params.year2;
  var sem = req.params.sem;
  var round = req.params.round;
  var nextYr;
  var nextSem;
  var nextRound;

  if (round < 3) {
    nextYr = ay;
    nextSem = sem;
    nextRound = (parseInt(round) + 1);
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
  console.log("Before 1");
  params = [nextYr, nextSem, nextRound];

  pool.query(sql, params).then((result) => {

    // next round is not one, update enrolled modules from registered moduile
    if (nextRound != 1) {
      console.log("Done 1");
      const sql3 = 'Select * from registeredmodule where ay = $1 and sem = $2 and round = $3';
      const params3 = [ay, sem, round];
      pool.query(sql3, params3).then((result3) => {
        var registeredModules = result3.rows;

        console.log("Registerd Modulessssssssss");
        console.log(registeredModules);
        console.log(registeredModules.length);
        //get modulecode and nusnet from people who registered
        var i;
        var registeredModulesAndStudent = [];
        for (i = 0; i < registeredModules.length; i++) {
          var singleRegisteredModulesAndStudent = [registeredModules[i].nusnetid, registeredModules[i].modulecode];

          console.log("singleRegisteredModulesAndStudent");
          console.log(singleRegisteredModulesAndStudent);
          registeredModulesAndStudent.push(singleRegisteredModulesAndStudent);

        }

        console.log("get modulecode and nusnet from people who registered"); //PASS
        console.log(registeredModulesAndStudent);
        console.log(registeredModulesAndStudent.length);

        //get points of students for the selected modules
        var j;
        var pointsAndStudentAndModules = [];
        const sql4 = "Select s1.nusnetid, max((Select year from student s where s.nusnetid = s1.nusnetid) + (SELECT CASE WHEN COUNT(1) > 0 THEN 2 ELSE 0 END AS count From Specializationcriteria s inner join declared d on s.specializationName = d.specializationName where s.specializationName = sd.specializationName AND s.modulecode = $2 AND d.nusnetid = s1.nusnetid) + (SELECT CASE WHEN COUNT(1) > 0 THEN 3 ELSE 0 END AS count From minorCriteria m1 inner join minoring m2 on m1.minorName = m2.minorName where m1.minorName = sm1.minorName AND m1.modulecode = $2 AND m2.nusnetid = s1.nusnetid) + (SELECT CASE WHEN COUNT(1) > 0 THEN 4 ELSE 0 END AS count  From majorCriteria m1 inner join majoring m2 on m1.majorName = m2.majorName where m1.majorName = sm.majorname AND m1.modulecode = $2 AND m2.nusnetid = s1.nusnetid)) as point from student s1 inner join majoring sm on sm.nusnetid = s1.nusnetid left join minoring sm1 on sm1.nusnetid = s1.nusnetid left join declared sd on sd.nusnetid = s1.nusnetid where s1.nusnetid=$1 group by s1.nusnetid";
        var params4;
        async function processArray() {
          for (j = 0; j < registeredModulesAndStudent.length; j++) {
            console.log("I'M HERERERERERERERERE");
            console.log(j);
            console.log(registeredModulesAndStudent[j]);
            console.log(registeredModulesAndStudent[j][0]);
            console.log(registeredModulesAndStudent[j][1]);

            params4 = [registeredModulesAndStudent[j][0], registeredModulesAndStudent[j][1]];
            await pool.query(sql4, params4).then((result4) => {
              var singlePointsAndStudentAndModules = [result4.rows[0].nusnetid, registeredModulesAndStudent[j][1], result4.rows[0].point];
              console.log("singlePointsAndStudentAndModules");
              console.log(singlePointsAndStudentAndModules); //MISSING

              pointsAndStudentAndModules.push(singlePointsAndStudentAndModules);
              // pointsAndStudentAndModules[i][0] = result4.rows[0].nusnetid;
              // pointsAndStudentAndModules[i][1] = registeredModulesAndStudent[i][1]; //moduleCode
              // pointsAndStudentAndModules[i][2] = result4.rows[0].point;
            })

          }

          console.log("get points of students for the selected modules");
          console.log(pointsAndStudentAndModules); //EMPTY

          //get distinct module in registered module and quota available
          const sql5 = 'select distinct m.modulecode, (m.quota - (select count(modulecode) from enrolledmodule where ay = $1 AND sem =$2 AND modulecode = m.modulecode)) as quota from registeredModule r inner join module m on r.modulecode = m.modulecode';
          const params5 = [ay, sem];
          var distinctModulesAndSlot;
          var distinctModulesAndSlotLength;
          pool.query(sql5, params5).then((result5) => {
            distinctModulesAndSlot = result5.rows;
            distinctModulesAndSlotLength = result5.rows.length;


            //insert into enrolled modules, module by module
            var k;
            console.log("asdasdasdasdasdasdasdasdsadasdsadsadsadsadsad");
            console.log(registeredModulesAndStudent);
            console.log(distinctModulesAndSlot);
            console.log(distinctModulesAndSlotLength);
            for (k = 0; k < distinctModulesAndSlotLength; k++) {
              var studentsToErol = [];
              var l;
              console.log("assdsadsadqgywhedtkrykmngtdmkbgrkmjtedkmetd");
              console.log(pointsAndStudentAndModules);


              for (l = 0; l < pointsAndStudentAndModules.length; l++) {
                console.log(pointsAndStudentAndModules[l]);
                console.log(pointsAndStudentAndModules[l][1]);
                if (distinctModulesAndSlot[k].modulecode == pointsAndStudentAndModules[l][1]) {
                  var student = pointsAndStudentAndModules[l];
                  console.log("PUSHED TO " + distinctModulesAndSlot[k].modulecode + " and " + pointsAndStudentAndModules[l][1])
                  studentsToErol.push(student);
                }
              }

              //sort points by descending order and insert into enrolledmodule
              studentsToErol.sort(compareSecondColumn);
              const sql6 = "INSERT INTO enrolledModule VALUES($1, $2, $3, $4, $5, 'Enrolled', '')";
              if (studentsToErol.length < distinctModulesAndSlot[k].quota) {
                var m;
                for (m = 0; m < studentsToErol.length; m++) {
                  var params6 = [studentsToErol[m][0], studentsToErol[m][1], ay, sem, round];
                  pool.query(sql6, params6);

                }
              }

              else {
                var m;
                console.log[studentsToErol];
                for (m = 0; m < distinctModulesAndSlot[k].quota; m++) {
                  console.log(m);
                  console.log(studentsToErol[m]);
                  var params6 = [studentsToErol[m][0], studentsToErol[m][1], ay, sem, round];
                  pool.query(sql6, params6);
                }
              }

            }
          }).catch((error) => {
            console.log(error);
          });
        }
        processArray();
      }).catch((error) => {
        console.log(error);
      });
    }

    //Check if it is sem 2 last round. Increase all students year
    if (nextSem == 1 && nextRound == 0) {
      pool.query(sql2).then((result2) => {

        res.redirect('/users/updateRound')

      })
        .catch((error) => {
          console.log(error);
        });
    }
    res.redirect('/users/updateRound')
  }).catch((error) => {
    console.log(error);
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
  res.render('login', { layout: false, message: req.flash('error') });
});

//Login process
router.post('/login', function (req, res, next) {
  passport.authenticate('local', {
    successRedirect: '/index',
    failureRedirect: '/users/login',
    failureFlash: 'Username/password combination wrong.'
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
