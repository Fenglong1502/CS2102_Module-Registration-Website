const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../ensureAuthenticated');
const pool = require('../database');

/* GET home page. */
router.get('/', ensureAuthenticated, function(req, res, next) {
  res.render('index', { title: 'ModRec - Homepage', layout: false});
});

module.exports = router;

