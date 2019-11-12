const express = require('express');
const router = express.Router();
const expressValidator = require('express-validator');
const ensureAuthenticated = require('../ensureAuthenticated');

const pool = require('../database');

router.get('/viewAllAppeals', ensureAuthenticated, function (req, res) {
    const sql = 'SELECT * FROM ModuleAppeal WHERE nusnetid = $1 AND ay = $2 AND sem = $3';
    const params = [req.user.nusnetid, req.user.ay, req.user.sem];
    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            res.render('viewAllAppeals', {
                appeals: result.rows,
            })
        }
    });
});

router.get('/adminViewAllAppeals', ensureAuthenticated, function (req, res) {
    const sql = 'SELECT * FROM ModuleAppeal ORDER BY ay desc, sem desc, round desc, modulecode asc';
    pool.query(sql, (error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            res.render('adminViewAllAppeals', {
                appeals: result.rows,
            })
        }
    });
});


router.get('/addAppeal', ensureAuthenticated, function (req, res) {
    res.render('addAppeal');
});


router.post("/viewAppealDetails/:modulecode/:nusnetid/:year1/:year2/:sem/:round", ensureAuthenticated, (req, res) => {
    const sql = "Select u.fname, u.lname, m2.faculty, s.year, s.course, (Select 1 from MajorCriteria m2 where m2.modulecode = $1 AND m2.majorname = s.course) as isCore ,m.*, m3.modulename from (moduleAppeal m inner join users u on u.nusnetid = m.nusnetid inner join student s on s.nusnetid = m.nusnetid) inner join major m2 on m2.majorname = s.course inner join module m3 on m3.modulecode = m.modulecode Where m.modulecode = $1 AND m.nusnetid = $2 AND m.ay = $3 AND m.sem = $4 AND m.round = $5";
    var modCode = req.params.modulecode;
    var nusnetid = req.params.nusnetid;
    var ay = req.params.year1 + "/" + req.params.year2;
    var sem = req.params.sem;
    var round = req.params.round;
    var isPending = false;
    var isApproved = false;

    const params = [modCode, nusnetid, ay, sem, round];

    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log("err: ", error);
        }
        else {
            if (result.rows[0].status == "Pending") {
                isPending = true;
            }
            else {
                if (result.rows[0].status == "Approved") {
                    isApproved = true;
                }
            }
            console.log(result.isApproved);
            res.render("viewAppealDetails",
                {
                    appeal: result.rows[0],
                    user: req.user,
                    isPending: isPending,
                    isApproved: isApproved
                });
        }
    });
});

router.post("/approveAppeal/:modulecode/:nusnetid/:year1/:year2/:sem/:round", ensureAuthenticated, (req, res) => {
    const sql = "Select u.fname, u.lname, m2.faculty, s.year, s.course, (Select 1 from MajorCriteria m2 where m2.modulecode = $1 AND m2.majorname = s.course) as isCore ,m.*, m3.modulename from (moduleAppeal m inner join users u on u.nusnetid = m.nusnetid inner join student s on s.nusnetid = m.nusnetid) inner join major m2 on m2.majorname = s.course inner join module m3 on m3.modulecode = m.modulecode Where m.modulecode = $1 AND m.nusnetid = $2 AND m.ay = $3 AND m.sem = $4 AND m.round = $5";
    const sql2 = "UPDATE moduleAppeal m SET status = 'Approved' Where m.modulecode = $1 AND m.nusnetid = $2 AND m.ay = $3 AND m.sem = $4 AND m.round = $5"
    var modCode = req.params.modulecode;
    var nusnetid = req.params.nusnetid;
    var ay = req.params.year1 + "/" + req.params.year2;
    var sem = req.params.sem;
    var round = req.params.round;
    var isPending = false;
    var isApproved = false;

    const params = [modCode, nusnetid, ay, sem, round];


    pool.query(sql2, params, (error, result) => {
        if (error) {
            console.log("err: ", error);
        }
        else {
            pool.query(sql, params, (error, result) => {
                if (error) {
                    console.log("err: ", error);
                }
                else {
                    if (result.rows[0].status === "Pending") {
                        isPending = true;
                    }
                    else {
                        if (result.rows[0].status === "Approved") {
                            isApproved = true;
                        }
                    }
                    console.log(result.isApproved);
                    res.render("viewAppealDetails",
                        {
                            appeal: result.rows[0],
                            user: req.user,
                            isPending: isPending,
                            isApproved: isApproved
                        });
                }
            });
        }
    });
});

router.post("/rejectAppeal/:modulecode/:nusnetid/:year1/:year2/:sem/:round", ensureAuthenticated, (req, res) => {
    const sql = "Select u.fname, u.lname, m2.faculty, s.year, s.course, (Select 1 from MajorCriteria m2 where m2.modulecode = $1 AND m2.majorname = s.course) as isCore ,m.*, m3.modulename from (moduleAppeal m inner join users u on u.nusnetid = m.nusnetid inner join student s on s.nusnetid = m.nusnetid) inner join major m2 on m2.majorname = s.course inner join module m3 on m3.modulecode = m.modulecode Where m.modulecode = $1 AND m.nusnetid = $2 AND m.ay = $3 AND m.sem = $4 AND m.round = $5";
    const sql2 = "UPDATE moduleAppeal m SET status = 'Rejected' Where m.modulecode = $1 AND m.nusnetid = $2 AND m.ay = $3 AND m.sem = $4 AND m.round = $5"
    var modCode = req.params.modulecode;
    var nusnetid = req.params.nusnetid;
    var ay = req.params.year1 + "/" + req.params.year2;
    var sem = req.params.sem;
    var round = req.params.round;
    var isPending = false;
    var isApproved = false;

    const params = [modCode, nusnetid, ay, sem, round];


    pool.query(sql2, params, (error, result) => {
        if (error) {
            console.log("err: ", error);
        }
        else {
            pool.query(sql, params, (error, result) => {
                if (error) {
                    console.log("err: ", error);
                }
                else {
                    if (result.rows[0].status === "Pending") {
                        isPending = true;
                    }
                    else {
                        if (result.rows[0].status === "Approved") {
                            isApproved = true;
                        }
                    }
                    console.log(result.isApproved);
                    res.render("viewAppealDetails",
                        {
                            appeal: result.rows[0],
                            user: req.user,
                            isPending: isPending,
                            isApproved: isApproved
                        });
                }
            });
        }
    });
});


router.post("/addAppeal", ensureAuthenticated, (req, res) => {
    const sql = "INSERT INTO ModuleAppeal VALUES ( $1, $2, $3, $4, $5, $6, $7, $8);";
    var modCode = req.body.moduleCode;
    var type = req.body.type;
    var detail = req.body.detail;
    var status = "Pending";

    const params = [req.user.nusnetid, modCode, req.user.ay, req.user.sem, req.user.round, detail, status, type];
    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log("err: ", error);
        } else {
            console.log("result?", result);
            res.redirect("/appeals/viewAllAppeals");
        }
    });
});

module.exports = router;