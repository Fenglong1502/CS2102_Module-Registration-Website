var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'ModRec - Homepage' , condition: true, anyArray:[1,2,3]});
});

router.get('/testing', function(req, res, next) {
  res.render('testing', {title: 'test', anyArray:[1,2]});
});

router.get('/appeal', function(req, res, next) {
  res.render('appeal', { title: 'ModRec - Appeal' , anyArray:[1,2,3]});
});

router.get('/addappeal', function(req, res, next) {
  res.render('addappeal', { title: 'ModRec - Add Appeals' , anyArray:[1,2,3]});
});

router.get('/login', function(req, res, next) {
  res.render('login', {title: 'ModRec - Login Page', logoTitle: 'ModRec',layout: false});
});

router.get('/studentInfo', function(req, res, next) {
  res.render('studentInfo', {title: 'Student Information'});
});

router.get('/allmodules', function(req, res, next) {
  res.render('allmodules', {title: 'All Modules', anyArray:[1,2,3]});
});


module.exports = router;
