const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../ensureAuthenticated');
const pool = require('../database');

router.get('/viewModuleDetail', function (req, res) {

    res.render('viewModuleDetail');
});

router.get('/registerNewModule', function (req, res) {
    const sql = 'select m.* from module m where m.moduleCode not in (SELECT moduleCode FROM RegisteredModule r WHERE r.nusnetid = $1);';
    const params = [req.user.nusnetid];

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

    const sql = 'Select * from enrolledModule WHERE nusnetid = $1 AND ay = $2 AND sem= $3';
    const sql2 = 'SELECT distinct ay, sem FROM Period ORDER BY ay desc, sem desc limit ((SELECT year from Student WHERE nusnetid = $1) * 2);';
    const params = [req.user.nusnetid, req.user.ay, req.user.sem];
    const params2 = [req.user.nusnetid];

    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            pool.query(sql2, params2, (error, result2) => {
                if (error) {
                    console.log('err: ', error);
                } else {
                    res.render('viewAllEnrolledModules', {
                        enrolledModules: result.rows,
                        semesters: result2.rows
                    })
                }
            });
        }
    });
});

router.post('/selectEnrolledModulesAY', ensureAuthenticated, function (req, res) {
    var yearSem = req.body.ay;
    var year = yearSem.substring(0, 5);
    var sem = yearSem.substring(5);

    const sql = 'Select * from enrolledModule WHERE nusnetid = $1 AND ay = $2 AND sem= $3';
    const sql2 = 'SELECT distinct ay, sem FROM Period ORDER BY ay desc, sem desc limit ((SELECT year from Student WHERE nusnetid = $1) * 2);';
    const params = [req.user.nusnetid, year, sem];
    const params2 = [req.user.nusnetid];

    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            pool.query(sql2, params2, (error2, result2) => {
                if (error2) {
                    console.log('err: ', error2);
                } else {
                    res.render('viewAllEnrolledModules', {
                        enrolledModules: result.rows,
                        semesters: result2.rows,
                        user: req.user
                    })
                }
            });
        }
    });
});



router.post('/searchModules', ensureAuthenticated, function (req, res) {
    const sql = "SELECT m.* FROM module m WHERE m.moduleCode NOT IN (SELECT moduleCode FROM RegisteredModule r WHERE r.nusnetid = $1) AND ((LOWER(m.modulecode) LIKE '%' || $2 ||'%') OR (LOWER(m.moduleName) LIKE '%' || $2 || '%'))";
    var searchedValue = req.body.searchedValue;
    const params = [req.user.nusnetid, searchedValue.toLowerCase()];

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

router.post('/registerModule/:moduleCode', ensureAuthenticated, function (req, res) {
    const sql = "INSERT INTO RegisteredModule VALUES ($1, $2, $3, $4, $5)";
    var ay = req.user.ay;
    var sem = req.user.sem;
    var round = req.user.round;
    var nusnetid = req.user.nusnetid;
    var moduleCode = req.params.moduleCode
    const params = [ay, sem, round, nusnetid, moduleCode];
    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            res.redirect('/modules/registerNewModule');
        }
    });
});

router.post('/removeModule/:moduleCode', ensureAuthenticated, function (req, res) {
    const sql = "DELETE FROM registeredModule WHERE nusnetid = $1 AND moduleCode = $2;";
    var nusnetid = req.user.nusnetid;
    var moduleCode = req.params.moduleCode
    const params = [nusnetid, moduleCode];
    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            res.redirect('/modules/viewRegisteredModule');
        }
    });
});


router.get('/viewAllModules', ensureAuthenticated, function (req, res) {

    res.render('allmodules');
});

router.get('/createModule', function (req, res) {

    res.render('modCreate');
});

router.get('/viewRegisteredModule', ensureAuthenticated, function (req, res) {
    const sql = 'SELECT r.nusnetid, r.ay, r.sem, r.round, m.* FROM registeredModule r INNER JOIN Module m ON r.moduleCode = m.moduleCode WHERE r.nusnetid = $1 AND r.ay = $2 AND r.sem = $3';
    const params = [req.user.nusnetid, req.user.ay, req.user.sem];

    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            res.render('viewRegisteredModule', {
                registeredModules: result.rows,
            })
        }
    });
});

module.exports = router;