const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const passport = require('passport');
const session = require('express-session');
const methodOverride = require('method-override');
const router = express.Router();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

//Using Passport for authentication
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
require('./passport')(passport);

//setting global variable for user -  check if logged in or not
app.get('*', function (req, res, next) {
  res.locals.user = req.user || null;
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// view engine setup
app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/' }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');



app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('index');
  } else {
    res.render('login', { layout: false });
  }
});


let index = require('./routes/index');
let users = require('./routes/users');
let appeals = require('./routes/appeals');
let majors = require('./routes/majors');
let modules = require('./routes/modules');
let registeredModules = require('./routes/registeredModules');

app.use('/index', index);
app.use('/users', users);
app.use('/appeals', appeals);
app.use('/majors', majors);
app.use('/modules', modules);
app.use('/registeredModules', registeredModules);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login');
}



// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
