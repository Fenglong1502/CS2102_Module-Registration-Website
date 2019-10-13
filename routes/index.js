var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'ModRec - Homepage' , condition: true, anyArray:[1,2,3]});
});

router.get('/testing', function(req, res, next) {
  res.render('testing', {title: 'asd', anyArray:[1,2]});
});

router.get('/appeal', function(req, res, next) {
  res.render('appeal', {title: 'Appeal'});
});
``
router.get('/login', function(req, res, next) {
  res.render('login', {title: 'ModRec - Login Page', logoTitle: 'ModRec',layout: false});
});

router.get('/studentInfo', function(req, res, next) {
  res.render('studentInfo', {title: 'StudentInfo'});
});

router.get('/viewModuleDetail', function(req, res, next) {
  res.render('viewModuleDetail', {title: 'ModuleDetail'});
});

module.exports = router;
