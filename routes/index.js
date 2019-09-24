var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' , condition: true, anyArray:[1,2,3]});
});

router.get('/testing', function(req, res, next) {
  res.render('testing', {title: 'asd'});
});

router.get('/appeal', function(req, res, next) {
  res.render('appeal', {title: 'Appeal'});
});


module.exports = router;
