const express = require('express');
const router = express.Router();
const expressValidator = require('express-validator');

const pool = require('../database');

router.get('/viewAllAppeals', function (req, res) {
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


router.get('/addAppeal', function (req, res) {
    res.render('addAppeal');
});


router.post("/addAppeal", (req, res) => {
      const sql = "INSERT INTO ModuleAppeal VALUES ( $1, $2, $3, $4, $5, $6, $7, $8);";
      var modCode = req.body.moduleCode;
      var type = req.body.type;
      var detail = req.body.detail;
      var status = "Pending";

      const params = [req.user.nusnetid, modCode, req.user.ay, req.user.sem, req.user.round, detail, status ,type];
      pool.query(sql, params, (error, result) => {
        if (error) {
          console.log("err: ", error);
        }
        console.log("result?", result);
        res.redirect("/appeals/viewAllAppeals");
      });
  });

module.exports = router;