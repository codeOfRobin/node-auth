var express = require("express")
var app = express()
var mongoose = require("mongoose")
var bcrypt   = require('bcrypt-nodejs');
var passport = require("passport")
var flash = require("connect-flash")
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var router       = express.Router()

var LocalStrategy   = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;


passport.use(new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : "1549587375360866",
        clientSecret    : "39a23f6bc61419e67c724a73e938bfd9",
        callbackURL     : "http://localhost:3000/auth/facebook/callback",
        profileFields: ["emails", "displayName"]
    },

    // facebook will send back the token and profile
    function(token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // find the user in the database based on their facebook id
            User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);

                // if the user is found, then log them in
                if (user) {
                    return done(null, user); // user found, return that user
                } else {
                    // if there is no user found with that facebook id, create them
                    var newUser            = new User();

                    // set all of the facebook information in our user model
                    newUser.facebook.id    = profile.id; // set the users facebook id
                    newUser.facebook.token = token; // we will save the token that facebook provides to the user
                    newUser.facebook.name  = profile._json.name // look at the passport user profile to see how names are returned
                    newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                    // save our user to the database
                    newUser.save(function(err) {
                        if (err)
                            throw err;

                        // if successful, return the new user
                        return done(null, newUser);
                    });
                }

            });
        });

    }));

passport.use(new TwitterStrategy({

    consumerKey     : "x64u6Y2ghFr0XJANcAvzY0ZbC",
    consumerSecret  : "PD6G88EPkfJdz0UC92asC77mxpyvhEicSTPetvJPagV9qsaGn2",
    callbackURL     : "	http://127.0.0.1:3000/auth/twitter/callback"

},
function(token, tokenSecret, profile, done) {

    // make the code asynchronous
// User.findOne won't fire until we have all our data back from Twitter
    process.nextTick(function() {

        User.findOne({ 'twitter.id' : profile.id }, function(err, user) {

            // if there is an error, stop everything and return that
            // ie an error connecting to the database
            if (err)
                return done(err);

            // if the user is found then log them in
            if (user) {
                return done(null, user); // user found, return that user
            } else {
                // if there is no user, create them
                var newUser                 = new User();

                // set all of the user data that we need
                newUser.twitter.id          = profile.id;
                newUser.twitter.token       = token;
                newUser.twitter.username    = profile.username;
                newUser.twitter.displayName = profile.displayName;

                // save our user into the database
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
            }
        });

});

}));
mongoose.connect("mongodb://localhost:27017/test")

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



var userSchema = mongoose.Schema({

    local            : {
        email        : String,
        password     : String,
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }

});

userSchema.methods.generateHash = function(password)
{
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
userSchema.methods.validPassword = function(password)
{
    return bcrypt.compareSync(password, this.local.password);
};
var User = mongoose.model('User', userSchema);


passport.serializeUser(function(user, done)
{
    done(null, user.id);
});
passport.deserializeUser(function(id, done)
{
    User.findById(id, function(err, user) {
        done(err, user);
    });
});
passport.use('local-signup', new LocalStrategy({
       // by default, local strategy uses username and password, we will override with email
       usernameField : 'email',
       passwordField : 'password',
       passReqToCallback : true // allows us to pass back the entire request to the callback
   },
   function(req, email, password, done) {

       // asynchronous
       // User.findOne wont fire unless data is sent back
       process.nextTick(function() {

       // find a user whose email is the same as the forms email
       // we are checking to see if the user trying to login already exists
       User.findOne({ 'local.email' :  email }, function(err, user) {
           // if there are any errors, return the error
           if (err)
               return done(err);

           // check to see if theres already a user with that email
           if (user) {
               return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
           } else {

               // if there is no user with that email
               // create the user
               var newUser            = new User();

               // set the user's local credentials
               newUser.local.email    = email;
               newUser.local.password = newUser.generateHash(password);

               // save the user
               newUser.save(function(err) {
                   if (err)
                       throw err;
                   return done(null, newUser);
               });
           }

       });

       });

   }));

passport.use('local-login', new LocalStrategy({
       // by default, local strategy uses username and password, we will override with email
       usernameField : 'email',
       passwordField : 'password',
       passReqToCallback : true // allows us to pass back the entire request to the callback
   },
   function(req, email, password, done) { // callback with email and password from our form

       // find a user whose email is the same as the forms email
       // we are checking to see if the user trying to login already exists
       User.findOne({ 'local.email' :  email }, function(err, user) {
           // if there are any errors, return the error before anything else
           if (err)
               return done(err);

           // if no user is found, return the message
           if (!user)
               return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

           // if the user is found but the password is wrong
           if (!user.validPassword(password))
               return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

           // all is well, return successful user
           return done(null, user);
       });

   }));




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
app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));
app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));
app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
}));
app.get('/', function(req, res) {
    res.render('index.ejs'); // load the index.ejs file
});

// route for login form
// route for processing the login form
// route for signup form
// route for processing the signup form

// route for showing the profile page
app.get('/profile', isLoggedIn, function(req, res) {
    res.render('profile.ejs', {
        user : req.user // get the user out of session and pass to template
    });
});

    // route for logging out
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));

// handle the callback after twitter has authenticated the user
app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        successRedirect : '/profile',
        failureRedirect : '/'
    }));
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}


app.listen(3000)
console.log("Chal gaya BC");
