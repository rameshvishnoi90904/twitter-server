var express = require("express");
var passport = require("passport");
var Strategy = require("passport-twitter").Strategy;
var OAuth = require("oauth").OAuth;
const CONSUMER_KEY = "";
const CONSUMER_SECRET = "";

var oauth = new OAuth(
	"https://api.twitter.com/oauth/request_token",
	"https://api.twitter.com/oauth/access_token",
	CONSUMER_KEY,
	CONSUMER_SECRET,
	"1.0",
	"CallBack URL",
	"HMAC-SHA1"
);
var userSecretToken, userToken;
// Configure the Twitter strategy for use by Passport.
//
// OAuth 1.0-based strategies require a `verify` function which receives the
// credentials (`token` and `tokenSecret`) for accessing the Twitter API on the
// user's behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(
	new Strategy(
		{
			consumerKey: CONSUMER_KEY,
			consumerSecret: CONSUMER_SECRET,
			callbackURL: "http://localhost:3000/login/twitter/return"
		},
		function(token, tokenSecret, profile, cb) {
			// In this example, the user's Twitter profile is supplied as the user
			// record.  In a production-quality application, the Twitter profile should
			// be associated with a user record in the application's database, which
			// allows for account linking and authentication with other identity
			// providers.
			userToken = token;
			userSecretToken = tokenSecret;
			return cb(null, profile, token, tokenSecret);
		}
	)
);

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Twitter profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
	cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
	cb(null, obj);
});

// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require("morgan")("combined"));
app.use(require("cookie-parser")());
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(
	require("express-session")({
		secret: "keyboard cat",
		resave: true,
		saveUninitialized: true
	})
);

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// Define routes.
app.get("/", function(req, res) {
	res.statusCode = 200;
	res.setHeader("Content-Type", "application/json");
	res.setHeader("Access-Control-Allow-Origin", "*");

	// res.write(JSON.stringify(req.user));
	res.end();
});

app.get("/login/twitter", passport.authenticate("twitter"));

app.get(
	"/login/twitter/return",
	passport.authenticate("twitter", { failureRedirect: "/login" }),
	function(req, res) {
		res.redirect("/getTweetList");
	}
);

app.get("/getTweetList/", function(req, res) {
	var url = "https://api.twitter.com/1.1/statuses/user_timeline.json";
	oauth.get(url, userToken, userSecretToken, function(err, body, response) {
		if (!err && response.statusCode == 200) {
			// success(body);
		} else {
			// error(err, response, body);
		}

		res.statusCode = 200;
		res.setHeader("Content-Type", "application/json");
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.write(body);
		res.end();
	});
});

// Twitter API end point to get recent 10 tweets from user time line. Replace screen_name value with twitter id.

// Make a get request to twitter RESt API

app.listen(3000);
