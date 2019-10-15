const express = require('express');
const router = express.Router();

const pool = require('../database');

router.get('/viewModuleDetail', function (req, res) {

    res.render('viewModuleDetail');
});

router.get('/addModule', function (req, res) {

    res.render('addModule');
});

router.get('/viewAllModules', function (req, res) {

    res.render('allmodules');
});

router.get('/createModule', function (req, res) {

    res.render('modCreate');
});

router.get('/registerModule', function (req, res) {

    res.render('registeredModule');
});

module.exports = router;