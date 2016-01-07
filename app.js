var express = require("express")
var app = express()
var mongoose = require("mongoose")
var passport = require("passport")
var flash = require("connect-flash")
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var router       = express.Router()

mongoose.connect("mongodb://localhost:27017")

app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms
app.set('view engine', 'jade'); // set up ejs for templating
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
app.set('views',__dirname + '/templates');
app.use('/static',express.static(__dirname + '/static'))
app.get('/', function(req, res)
{
    res.render('index.jade'); // load the index.ejs file
});
app.get('/login', function(req, res)
{
    res.render('login.jade',{ message: req.flash('loginMessage') }); // load the index.ejs file
});
app.get('/signup', function(req, res)
{
    res.render('signup.jade', { message: req.flash('signupMessage') }); // load the index.ejs file
});
app.get('/profile', function(req, res)
{
    res.render('profile.jade',{ user : req.user}); // load the index.ejs file
});
app.get('/logout', function(req, res)
{
    req.logout();
    res.redirect('/');
});

app.listen(3000)
console.log("Chal gaya BC");
