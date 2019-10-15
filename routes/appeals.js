const express = require('express');
const router = express.Router();
const expressValidator = require('express-validator');

const pool = require('../database');

router.get("/allAppeals")

router.get('/viewAllAppeals', function (req, res) {
    const sql = 'SELECT * FROM ModuleAppeal';
    pool.query(sql, (error, result) => {

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
    // req.checkBody("moduleCode", "Module Code is required").notEmpty();
    // req.checkBody("type", "Please select the appeal type").notEmpty();
    // let errors = req.validationErrors();
    // if (errors) {
    //   res.render('addAppeal');
    //   console.log(errors);
  
    // } else {
      const sql = "INSERT INTO ModuleAppeal VALUES ('E1234567', $1, '19/20', 2, 1, $2, 'Pending', $3);";
      var modCode = req.body.moduleCode;
      var type = req.body.type;
      var detail = req.body.detail;

      const params = [moduleCode, detail, type];
      pool.query(sql, params, (error, result) => {
        if (error) {
          console.log("err: ", error);
        }
        console.log("result?", result);
        res.redirect("/viewAllAppeals");
      });
    // }
  });
  


module.exports = router;