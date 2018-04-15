var express = require("express");
var passport = require("passport");
var request = require("request"),cors = require('cors');
var Strategy = require("passport-twitter").Strategy;
var OAuth = require("oauth").OAuth;
const CONSUMER_KEY = "";
const CONSUMER_SECRET = "";
var router = express.Router();
var oauth = new OAuth(
	"https://api.twitter.com/oauth/request_token",
	"https://api.twitter.com/oauth/access_token",
	CONSUMER_KEY,
	CONSUMER_SECRET,
	"1.0",
	"CallBack URL",
	"HMAC-SHA1"
);
var app = express();
var corsOption = {
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  exposedHeaders: ['x-auth-token']
};
app.use(cors(corsOption));
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
	res.end();
});


app.get("/getTweetList/",function(req, res) {
	var url = "https://api.twitter.com/1.1/statuses/user_timeline.json";
	oauth.get(url, req.headers["clienttoken"], req.headers["clientsecrettoken"], function(err, body, response) {
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

router.route('/auth/twitter/reverse')
  .post(function(req, res) {
    request.post({
      url: 'https://api.twitter.com/oauth/request_token',
      oauth: {
        oauth_callback: "http://localhost:3000/",
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET
      }
    }, function (err, r, body) {
      if (err) {
        return res.send(500, { message: e.message });
      }
      var jsonStr = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
      res.send(JSON.parse(jsonStr));
    });
  });

router.route('/auth/twitter')
  .post(function(req, res, next) {
    request.post({
      url: `https://api.twitter.com/oauth/access_token?oauth_verifier`,
      oauth: {
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET,
        token: req.query.oauth_token
      },
      form: { oauth_verifier: req.query.oauth_verifier }
    }, function (err, r, body) {
      if (err) {
        return res.send(500, { message: err.message });
      }

      const bodyString = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
      const parsedBody = JSON.parse(bodyString);
      req.body['oauth_token'] = parsedBody.oauth_token;
      req.body['oauth_token_secret'] = parsedBody.oauth_token_secret;
      req.body['user_id'] = parsedBody.user_id;
			return res.status(200).send(JSON.stringify(parsedBody));
    });
  });

app.use('/api/v1', router);
app.listen(3001);
