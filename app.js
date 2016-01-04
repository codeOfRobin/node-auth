var express  = require('express');
var app      = express();
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');


mongoose.connect("mongodb://localhost:27017");

// require('./config/passport')(passport);

app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms
app.use('views',__dirname + '/templates')
app.set('view engine', 'jade');
app.set('static',express.static(__dirname + 'public'))

app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


app.get('/',function (req,res)
{
    res.render('index.jade')
})

app.get('/login',function (req,res)
{
    res.render('login.jade',{message:req.flash('loginMessage')})
})

app.get('/signup',function (req,res)
{
    res.render('signup.jade',{message:req.flash('signupMessage')})
})

app.get('/profile', isLoggedIn, function(req, res)
{
    res.render('profile.jade', {user : req.user});
});

app.get('/logout', function(req, res)
{
    req.logout();
    res.redirect('/');
});

function isLoggedIn(req, res, next)
{
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}
app.listen(3000);
console.log('The magic happens on port ' + port);
