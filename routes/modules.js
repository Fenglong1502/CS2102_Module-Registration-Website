const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../ensureAuthenticated');
const pool = require('../database');

router.get('/viewModuleDetail', function (req, res) {

    res.render('viewModuleDetail');
});

router.get('/registerNewModule', function (req, res) {
    const sql = "select m.* from module m where m.moduleCode not in (SELECT moduleCode FROM RegisteredModule r WHERE r.nusnetid = $1) AND (m.sem is null or m.sem=$2) AND  m.moduleCode not in (SELECT modulecode FROM enrolledModule Where nusnetid = $1 AND grade <> 'F' AND grade <> 'U') ORDER BY m.modulecode asc";
    const params = [req.user.nusnetid, req.user.sem];

    pool.query(sql, params, (error, result) => {

        if (error) {
            console.log('err: ', error);
        } else {
            res.render('registerNewModule', {
                modules: result.rows,
            })
        }
    });
});



router.get('/viewEnrolledModules', ensureAuthenticated, function (req, res) {

    const sql = 'Select e.*, m.modulename, m.credit from enrolledModule e inner join module m on m.modulecode = e.modulecode WHERE e.nusnetid = $1 AND e.ay = $2 AND e.sem= $3';
    var sql2 = 'SELECT distinct ay, sem FROM Period ORDER BY ay desc, sem desc limit ((SELECT year from Student WHERE nusnetid = $1) * 2)';
    const sql3 = 'Select ay, sem From period order by ay desc, sem desc limit 1';
    const params = [req.user.nusnetid, req.user.ay, req.user.sem];
    const params2 = [req.user.nusnetid];


    pool.query(sql3, (error, result3) => {
        if (error) {
            console.log('err: ', error);
        } else {
            pool.query(sql, params, (error, result) => {
                if (error) {
                    console.log('err: ', error);
                } else {
                    if (result3.rows[0].sem == 1) {
                        sql2 = 'SELECT distinct ay, sem FROM Period ORDER BY ay desc, sem desc limit ((SELECT year from Student WHERE nusnetid = $1) * 2 -1)';
                    }
                    pool.query(sql2, params2, (error, result2) => {
                        if (error) {
                            console.log('err: ', error);
                        } else {
                            res.render('viewAllEnrolledModules', {
                                enrolledModules: result.rows,
                                semesters: result2.rows,
                                year: result3.rows[0].ay,
                                sem: result3.rows[0].sem
                            })
                        }
                    });
                }
            });
        }
    });
});

router.post('/selectEnrolledModulesAY', ensureAuthenticated, function (req, res) {
    var yearSem = req.body.ay;
    var year = yearSem.substring(0, 5);
    var sem = yearSem.substring(5);

    const sql = 'Select e.*, m.modulename, m.credit from enrolledModule e inner join module m on m.modulecode = e.modulecode WHERE e.nusnetid = $1 AND e.ay = $2 AND e.sem= $3';
    var sql2 = 'SELECT distinct ay, sem FROM Period ORDER BY ay desc, sem desc limit ((SELECT year from Student WHERE nusnetid = $1) * 2);';
    const sql3 = 'Select sem From period order by ay desc, sem desc limit 1';
    const params = [req.user.nusnetid, year, sem];
    const params2 = [req.user.nusnetid];


    pool.query(sql3, (error, result3) => {
        if (error) {
            console.log('err: ', error);
        } else {
            pool.query(sql, params, (error, result) => {
                if (error) {
                    console.log('err: ', error);
                } else {
                    if (result3.rows[0].sem == 1) {
                        sql2 = 'SELECT distinct ay, sem FROM Period ORDER BY ay desc, sem desc limit ((SELECT year from Student WHERE nusnetid = $1) * 2 -1)';
                    }
                    pool.query(sql2, params2, (error2, result2) => {
                        if (error2) {
                            console.log('err: ', error2);
                        } else {

                            res.render('viewAllEnrolledModules', {
                                enrolledModules: result.rows,
                                semesters: result2.rows,
                                year: year,
                                sem: sem,
                                user: req.user
                            })
                        }
                    });
                }
            });
        }
    });
});



router.post('/searchModules', ensureAuthenticated, function (req, res) {
    const sql = "SELECT m.* FROM module m WHERE m.moduleCode NOT IN (SELECT moduleCode FROM RegisteredModule r WHERE r.nusnetid = $1) AND ((LOWER(m.modulecode) LIKE '%' || $2 ||'%') OR (LOWER(m.moduleName) LIKE '%' || $2 || '%')) AND (m.sem is null or m.sem=$3)";
    var searchedValue = req.body.searchedValue;
    const params = [req.user.nusnetid, searchedValue.toLowerCase(), req.user.sem];

    pool.query(sql, params, (error, result) => {

        if (error) {
            console.log('err: ', error);
        } else {
            res.render('registerNewModule', {
                modules: result.rows,
                searchedValue: searchedValue
            })
        }
    });
});

router.post('/searchModulesAdmin', ensureAuthenticated, function (req, res) {
    const sql = "SELECT m.* FROM module m WHERE (LOWER(m.modulecode) LIKE '%' || $1 ||'%') OR (LOWER(m.moduleName) LIKE '%' || $1 || '%')";
    var searchedValue = req.body.searchedValue;
    const params = [searchedValue.toLowerCase()];

    pool.query(sql, params, (error, result) => {

        if (error) {
            console.log('err: ', error);
        } else {
            res.render('adminViewAllModules', {
                modules: result.rows,
                searchedValue: searchedValue,
                user: req.user
            })
        }
    });
});

router.post('/registerModule/:moduleCode', ensureAuthenticated, function (req, res) {
    const sql = "INSERT INTO RegisteredModule VALUES ($1, $2, $3, $4, $5)";
    const sql2 = "Select preReqModuleCode from Prerequisite where moduleCode = $1";
    const sql3 = "select modulecode from enrolledModule Where nusnetid = $1";

    var ay = req.user.ay;
    var sem = req.user.sem;
    var round = req.user.round;
    var nusnetid = req.user.nusnetid;
    var moduleCode = req.params.moduleCode;
    const params = [ay, sem, round, nusnetid, moduleCode];
    const params2 = [moduleCode];
    const params3 = [nusnetid];


    pool.query(sql2, params2).then((result2) => {
        var prereqList = result2.rows;
        if (prereqList.length > 0) {
            pool.query(sql3, params3).then((result3) => {
                var moduleDone = result3.rows;
                var i;
                var check = 0;
                var prereqMessage = JSON.stringify(prereqList[0].prereqmodulecode);
                
                console.log(prereqList);
                console.log(prereqList[0]);
                console.log(prereqMessage);
                for (i = 0; i < prereqList.length; i++) {
                    var j;
                    if (i > 0) {
                        prereqMessage += (", " + JSON.stringify(prereqList[i].prereqmodulecode));
                        console.log(prereqMessage);
                    }

                    for (j = 0; j < moduleDone.length; j++) {
                        if (prereqList[i].prereqmodulecode == moduleDone[j].modulecode) {
                            check++;
                        }
                    }
                }
                if (check == prereqList.length) {
                    pool.query(sql, params, (error, result) => {
                        if (error) {
                            console.log('err: ', error);
                        } else {
                            res.redirect('/modules/registerNewModule');
                        }
                    });
                }
                else {
                    const sql4 = "select m.* from module m where m.moduleCode not in (SELECT moduleCode FROM RegisteredModule r WHERE r.nusnetid = $1) AND (m.sem is null or m.sem=$2) AND  m.moduleCode not in (SELECT modulecode FROM enrolledModule Where nusnetid = $1 AND grade <> 'F' AND grade <> 'U') ORDER BY m.modulecode asc";
                    const params4 = [req.user.nusnetid, req.user.sem];

                    pool.query(sql4, params4, (error, result) => {

                        if (error) {
                            console.log('err: ', error);
                        } else {
                            res.render('registerNewModule', {
                                modules: result.rows,
                                message: "Please ensure that you have completed " + prereqMessage + " before applying for the module '" + moduleCode + "'!",
                                user: req.user
                            })
                        }
                    });
                }
            }).catch((error) => {
                console.log(error);
            });
        }
        else {
            pool.query(sql, params, (error, result) => {
                if (error) {
                    console.log('err: ', error);
                } else {
                    res.redirect('/modules/registerNewModule');
                }
            });
        }
    })
        .catch((error) => {
            console.log(error);
        });


});

router.post('/removeModule/:moduleCode', ensureAuthenticated, function (req, res) {
    const sql = "DELETE FROM registeredModule WHERE nusnetid = $1 AND moduleCode = $2;";
    var nusnetid = req.user.nusnetid;
    var moduleCode = req.params.moduleCode;
    const params = [nusnetid, moduleCode];
    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            res.redirect('/modules/viewRegisteredModule');
        }
    });
});


router.get('/adminViewAllModules', ensureAuthenticated, function (req, res) {
    const sql = 'select * from module order by faculty asc, department asc, modulecode asc';
    pool.query(sql, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            res.render('adminViewAllModules'
                , {
                    modules: result.rows,
                })
        }
    });
});

router.post('/viewModuleDetail/:modulecode/:modulename', ensureAuthenticated, function (req, res) {
    const sql = 'Select distinct ay, sem from enrolledModule WHERE modulecode = $1 ORDER BY ay desc, sem desc';
    const sql2 = 'select u.fname, u.lname, s.year, s.course , e.* from enrolledModule e inner join users u on e.nusnetid = u.nusnetid inner join student s on e.nusnetid = s.nusnetid Where moduleCode = $1 AND e.ay = (Select ay from enrolledModule WHERE modulecode = $1 ORDER BY ay desc, sem desc limit 1) AND e.sem = (Select sem from enrolledModule WHERE modulecode = $1 ORDER BY ay desc, sem desc limit 1)';
    const sql3 = 'Select ay, sem from period order by ay desc, sem desc limit 1';
    const sql4 = "Select * from Prerequisite where moduleCode = $1 ORDER BY prereqmodulecode";
    const params = [req.params.modulecode];
    const params2 = [req.params.modulecode];
    const params4 = [req.params.modulecode];

    var currentAy;
    var currentSem;
    var isCurrentSem = false;

    pool.query(sql4, params4, (error, result4) => {
        if (error) {
            console.log('err: ', error);
        } else {
            pool.query(sql3, (error, result3) => {
                if (error) {
                    console.log('err: ', error);
                } else {
                    currentAy = result3.rows[0].ay;
                    currentSem = result3.rows[0].sem;

                    pool.query(sql, params, (error, result) => {
                        if (error) {
                            console.log('err: ', error);
                        } else {
                            pool.query(sql2, params2, (error, result2) => {
                                if (error) {
                                    console.log('err: ', error);
                                } else {
                                    if (result.rows.length == 0) {
                                        res.render('viewModuleDetail',
                                            {
                                                ayyear: result.rows,
                                                students: result2.rows,
                                                quota: result2.rowCount,
                                                modulename: req.params.modulename,
                                                modulecode: req.params.modulecode,
                                                user: req.user,
                                                isCurrentSem: isCurrentSem,
                                                prereq: result4.rows
                                            })
                                    }
                                    else {
                                        if ((currentAy === result.rows[0].ay) && (currentSem === result.rows[0].sem)) {
                                            isCurrentSem = true;
                                        }
                                        res.render('viewModuleDetail',
                                            {
                                                ayyear: result.rows,
                                                students: result2.rows,
                                                quota: result2.rowCount,
                                                modulename: req.params.modulename,
                                                modulecode: req.params.modulecode,
                                                user: req.user,
                                                ay: result.rows[0].ay,
                                                sem: result.rows[0].sem,
                                                isCurrentSem: isCurrentSem,
                                                prereq: result4.rows
                                            })
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});



router.post('/viewModuleDetail/:modulecode/:modulename/:i', ensureAuthenticated, function (req, res) {
    const sql = 'Select distinct ay, sem from enrolledModule WHERE modulecode = $1 ORDER BY ay desc, sem desc';
    const sql2 = 'select u.fname, u.lname, s.year, s.course , e.* from enrolledModule e inner join users u on e.nusnetid = u.nusnetid inner join student s on e.nusnetid = s.nusnetid Where moduleCode = $1 AND e.ay = $2 AND e.sem = $3';
    const sql3 = 'Select ay, sem from period order by ay desc, sem desc limit 1';
    const sql4 = "Select * from Prerequisite where moduleCode = $1 ORDER BY prereqmodulecode";
    const params = [req.params.modulecode];
    var yearSem = req.body.ay;
    var ay = yearSem.substring(0, 5);
    var sem = yearSem.substring(5);
    const params2 = [req.params.modulecode, ay, sem];
    const params4 = [req.params.modulecode];

    var currentAy;
    var currentSem;
    var isCurrentSem = false;

    pool.query(sql4, params4, (error, result4) => {
        if (error) {
            console.log('err: ', error);
        } else {
            pool.query(sql3, (error, result3) => {
                if (error) {
                    console.log('err: ', error);
                } else {
                    currentAy = result3.rows[0].ay;
                    currentSem = result3.rows[0].sem;

                    pool.query(sql, params, (error, result) => {
                        if (error) {
                            console.log('err: ', error);
                        } else {
                            pool.query(sql2, params2, (error, result2) => {
                                if (error) {
                                    console.log('err: ', error);
                                } else {
                                    if ((currentAy == ay) && (currentSem == sem)) {
                                        isCurrentSem = true;
                                    }
                                    res.render('viewModuleDetail',
                                        {
                                            ayyear: result.rows,
                                            students: result2.rows,
                                            quota: result2.rowCount,
                                            modulename: req.params.modulename,
                                            modulecode: req.params.modulecode,
                                            user: req.user,
                                            ay: ay,
                                            sem: sem,
                                            isCurrentSem: isCurrentSem,
                                            prereq: result4.rows
                                        })
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});



router.post('/removeEnrolledStudent/:modulecode/:nusnetid/:year1/:year2/:sem', ensureAuthenticated, function (req, res) {
    var nusnetid = req.params.nusnetid;
    var modulecode = req.params.modulecode;
    var ay = req.params.year1 + "/" + req.params.year2;
    var sem = req.params.sem;

    const sql = 'Select distinct ay, sem from enrolledModule WHERE modulecode = $1 ORDER BY ay desc, sem desc';
    const sql2 = 'select u.fname, u.lname, s.year, s.course , e.* from enrolledModule e inner join users u on e.nusnetid = u.nusnetid inner join student s on e.nusnetid = s.nusnetid Where moduleCode = $1 AND e.ay = $2 AND e.sem = $3';
    const sql3 = 'DELETE FROM enrolledModule WHERE nusnetid = $1 AND modulecode = $2 AND ay = $3 AND sem = $4;';
    const sql4 = 'SELECT modulename from module where modulecode = $1';
    const sql5 = 'Select ay, sem from period order by ay desc, sem desc limit 1';
    const sql6 = "Select * from Prerequisite where moduleCode = $1 ORDER BY prereqmodulecode";
    const params = [modulecode];
    const params2 = [modulecode, ay, sem];
    const params3 = [nusnetid, modulecode, ay, sem];
    const params4 = [modulecode];
    const params6 = [modulecode];

    var currentAy;
    var currentSem;
    var isCurrentSem = false;

    pool.query(sql6, params6, (error, result6) => {
        if (error) {
            console.log('err: ', error);
        } else {
            pool.query(sql5, (error, result5) => {
                if (error) {
                    console.log('err: ', error);
                } else {
                    currentAy = result5.rows[0].ay;
                    currentSem = result5.rows[0].sem;

                    pool.query(sql4, params4, (error, result4) => {
                        if (error) {
                            console.log('err: ', error);
                        } else {
                            console.log(result4.rows[0].modulename);
                            pool.query(sql3, params3, (error, result3) => {
                                if (error) {
                                    console.log('err: ', error);
                                } else {
                                    pool.query(sql, params, (error, result) => {
                                        if (error) {
                                            console.log('err: ', error);
                                        } else {
                                            pool.query(sql2, params2, (error, result2) => {
                                                if (error) {
                                                    console.log('err: ', error);
                                                } else {
                                                    if ((currentAy == ay) && (currentSem == sem)) {
                                                        isCurrentSem = true;
                                                    }
                                                    res.render('viewModuleDetail',
                                                        {
                                                            ayyear: result.rows,
                                                            students: result2.rows,
                                                            quota: result2.rowCount,
                                                            modulename: result4.rows[0].modulename,
                                                            modulecode: req.params.modulecode,
                                                            user: req.user,
                                                            ay: ay,
                                                            sem: sem,
                                                            isCurrentSem: isCurrentSem,
                                                            prereq: result6.rows
                                                        })
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});



router.get('/addStudentToModule/:modulecode/:year1/:year2/:sem', ensureAuthenticated, function (req, res) {
    var modulecode = req.params.modulecode;
    var ay = req.params.year1 + "/" + req.params.year2;
    var sem = req.params.sem;

    const sql = "Select s.*, u.fname, u.lname, (select 1 from majorcriteria m where m.majorname = s.course AND m.modulecode = $1) as isCore from student s inner join users u on u.nusnetid = s.nusnetid where s.nusnetid not in (select nusnetid from enrolledModule where modulecode=$1 AND ay = $2 AND sem = $3) AND s.nusnetid not in (select nusnetid from enrolledModule where modulecode = $1 AND grade <> 'F' AND grade <> 'U');";
    const params = [modulecode, ay, sem]
    const sql2 = "Select * from module where modulecode = $1";
    const params2 = [modulecode];

    var modulename;


    pool.query(sql2, params2, (error, result2) => {
        if (error) {
            console.log('err: ', error);
        } else {
            modulename = result2.rows[0].modulename;
            pool.query(sql, params, (error, result) => {
                if (error) {
                    console.log('err: ', error);
                } else {
                    res.render('addStudentToModule',
                        {
                            students: result.rows,
                            modulecode: modulecode,
                            ay: ay,
                            sem: sem,
                            user: req.user,
                            modulename: modulename
                        })
                }
            });
        }
    });
});

router.get('/editModule/:modulecode', ensureAuthenticated, function (req, res) {
    var modulecode = req.params.modulecode;

    const sql = "Select * FROM Module WHERE modulecode = $1";
    const sql2 = "Select * from Prerequisite where moduleCode = $1 ORDER BY prereqmodulecode";
    const params = [modulecode];
    const params2 = [modulecode];

    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            pool.query(sql2, params2, (error, result2) => {
                if (error) {
                    console.log('err: ', error);
                } else {
                    res.render('editModule', {
                        module: result.rows[0],
                        prereq: result2.rows
                    })
                }
            });
        }
    });
});


router.post('/removePrereq/:modulecode/:prereq', ensureAuthenticated, function (req, res) {
    var modulecode = req.params.modulecode;
    var prereq = req.params.prereq;

    const sql = "DELETE FROM Prerequisite WHERE moduleCode = $1 AND preReqModuleCode = $2";
    const params = [modulecode, prereq];

    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            res.redirect('/modules/editModule/' + modulecode);
        }
    });
});


router.get('/deleteModule/:modulecode', ensureAuthenticated, function (req, res) {
    var modulecode = req.params.modulecode;

    const sql = "DELETE FROM Module WHERE modulecode = $1";
    const params = [modulecode];

    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            res.redirect('/modules/adminViewAllModules')
        }
    });
});


router.post('/addStudent/:modulecode/:nusnetid/:year1/:year2/:sem', ensureAuthenticated, function (req, res) {

    var nusnetid = req.params.nusnetid;
    var modulecode = req.params.modulecode;
    var ay = req.params.year1 + "/" + req.params.year2;
    var sem = req.params.sem;
    var round = 0
    var grade = '';
    var status = 'Ongoing'

    const sql = "INSERT INTO enrolledModule VALUES($1, $2, $3, $4, $5, $6, $7);";
    const params = [nusnetid, modulecode, ay, sem, round, status, grade];

    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            res.redirect('/modules/addStudentToModule/' + modulecode + '/' + ay + '/' + sem)
        }
    });
});

router.post('/createModule', ensureAuthenticated, function (req, res) {
    var modCode = req.body.modCode;
    var modName = req.body.modName;
    var modCredit = req.body.modCredit;
    var desc = req.body.desc;
    var quota = req.body.quota;
    var sem = req.body.sem;
    if (sem == "sem12") {
        sem = null;
    }
    var department = req.body.department;
    var faculty = 'School of Computing';


    const sql = "INSERT INTO Module VALUES ($1, $2, $3, $4, $5, $6, $7, $8)";

    const params = [modCode, modName, modCredit, desc, quota, sem, department, faculty];

    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            res.redirect('/modules/createModule');
        }
    });
});


router.post('/updateModule/:oldModCode', ensureAuthenticated, function (req, res) {
    var modCode = req.body.modCode;
    var modName = req.body.modName;
    var modCredit = req.body.modCredit;
    var desc = req.body.desc;
    var quota = req.body.quota;
    var sem = req.body.sem;
    if (sem == "sem12") {
        sem = null;
    }
    var department = req.body.department;
    var faculty = 'School of Computing';
    var oldModCode = req.params.oldModCode;

    const sql = "UPDATE Module m SET moduleCode = $1, moduleName = $2, credit = $3, description = $4, quota = $5, sem = $6, department = $7, faculty = $8 Where m.modulecode = $9";

    const params = [modCode, modName, modCredit, desc, quota, sem, department, faculty, oldModCode];

    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            res.redirect('/modules/adminViewAllModules');
        }
    });
});

router.post('/addPrereq/:modCode', ensureAuthenticated, function (req, res) {
    var prereq = req.body.prereq;
    var modCode = req.params.modCode;

    const sql = "INSERT INTO Prerequisite VALUES($1, $2 ,null)";
    const params = [modCode, prereq];

    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            res.redirect('/modules/editModule/' + modCode);
        }
    });
});


router.get('/createModule', ensureAuthenticated, function (req, res) {

    res.render('modCreate');
});



router.get('/viewRegisteredModule', ensureAuthenticated, function (req, res) {
    const sql = 'SELECT r.nusnetid, r.ay, r.sem, r.round, m.* FROM registeredModule r INNER JOIN Module m ON r.moduleCode = m.moduleCode WHERE r.nusnetid = $1 AND r.ay = $2 AND r.sem = $3 AND r.round =$4';
    const sql2 = 'select sum(credit) as sum from enrolledmodule e inner join module m on m.modulecode = e.modulecode where e.nusnetid = $1 AND e.ay=$2 AND e.sem =$3';
    const sql3 = 'select sum(credit) as sum from registeredModule r inner join module m on m.modulecode = r.modulecode where r.nusnetid = $1 AND r.ay=$2 AND r.sem =$3 AND r.round = $4';
    const params = [req.user.nusnetid, req.user.ay, req.user.sem, req.user.round];
    const params2 = [req.user.nusnetid, req.user.ay, req.user.sem];

    var enrolCredit;
    var registerCredit;

    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            pool.query(sql2, params2, (error, result2) => {
                if (error) {
                    console.log('err: ', error);
                } else {
                    pool.query(sql3, params, (error, result3) => {
                        if (error) {
                            console.log('err: ', error);
                        } else {
                            if (result2.rows[0].sum == null) {
                                enrolCredit = 0;
                            }
                            else {
                                enrolCredit = parseInt(result2.rows[0].sum);
                            }
                            if (result3.rows[0].sum == null) {
                                registerCredit = 0;
                            }
                            else {
                                registerCredit = parseInt(result3.rows[0].sum);
                            }

                            res.render('viewRegisteredModule', {
                                registeredModules: result.rows,
                                totalcredit: enrolCredit + registerCredit,
                                enrolCredit: enrolCredit,
                                registerCredit: registerCredit,
                                creditLeft: (32 - registerCredit - enrolCredit) ,
                                round: req.user.round
                            })
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;