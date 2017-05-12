var config = require('./config.json');
var debug_bonraybio_app = require('debug')('bonraybio:app');
var debug_bonraybio_app2 = require('debug')('bonraybio:app2');

var express = require('express');
var mongoosePrepare = require('./model/mongoosePrepare');
var bonrayboi = require('./model/bonraybio');

//var util = require('util');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var device = require('express-device');


var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');

var index = require('./routes/index');
var users = require('./routes/users');
var register = require('./routes/register');
var accountRouter = require('./routes/account');

var utils = require('./helpers/utils');


var app = express();
var session = require('express-session');

utils.mkDir(config.upload_tmp_path);
utils.mkDir(config.base64_join_path);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if (app.get('env')  == 'development'){
    //process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    app.use(logger('dev'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(device.capture());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



// pass the express object so it can inherit from MemoryStore
var MemcachedStore = require('connect-memcached')(session);
var mcds = new MemcachedStore({ hosts: `${config.memcached.host}:${config.memcached.port}`});

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: mcds,
    cookie: { path: '/', httpOnly: true, secure: false, maxAge: 5 * 60 * 1000 },// Week long cookie
}));

app.use(function(req, res, next){
    res.setTimeout(480000, function(){ // 4 minute timeout adjust for larger uploads
        console.log('Request has timed out.');
        res.status(408)
        return res.end();
    });

    next();
});

app.use(passport.initialize());
app.use(flash());
app.use(passport.session());

app.use(function(req, res, next){

    var userAgent = req.headers['user-agent'];
    if(userAgent == config.deviceType.phone) {
        req.device.type = config.deviceType.phone;
    }

    //TODO: remove the fake code for desktop in future
    if(req.device.type == config.deviceType.desktop){
        req.headers['secret_key'] = config.secret_key;
    }
    if(req.query.secret_key) {
        var secret_key_decode = decodeURIComponent(req.query.secret_key);
        req.headers['secret_key'] = secret_key_decode;
    }

    var secret_key = req.get('secret_key');
    debug_bonraybio_app(`pre request secret_key: ${secret_key}`);
    debug_bonraybio_app(`I listened on port: : ${app.get('port')}`);

    if(secret_key != config.secret_key) {

        var err = config.response_error.permission.no_secret_key
        utils.send_failure_json(res, 401, err);

        debug_bonraybio_app("secret_key " + secret_key);
        return;
    }

    next();
});


var connectUrl = `mongodb://${config.mongodb.server}:27017/${config.mongodb.db}`;

let options = {
    db: {native_parser: true},
    replset: {
        auto_reconnect:false,
        poolSize: 10,
        socketOptions: {
            keepAlive: 1000,
            connectTimeoutMS: 30000
        }
    },
    server: {
        poolSize: 5,
        socketOptions: {
            keepAlive: 1000,
            connectTimeoutMS: 30000
        }
    },
    user: config.mongodb.user,
    pass: config.mongodb.pass,
    auth:{
        authdb: 'admin'
    }
};


app.model = {};

mongoosePrepare.init(connectUrl, options, function (err, mongooseConnected) {

    if(err) throw  Error(err);
    bonrayboi.initWithConnection(mongooseConnected);
    app.model.AccountDetailModel = bonrayboi.AccountDetailModel;
    app.model.AccountTokenModel = bonrayboi.AccountTokenModel;
    app.model.AccountProfileModel =  bonrayboi.AccountProfileModel;
    app.model.AccountModel = bonrayboi.AccountModel;
    app.model.TestItemModel = bonrayboi.TestItemModel;
    app.model.passport = passport;
    passport.use(new LocalStrategy(bonrayboi.AccountModel.authenticate()));

    passport.serializeUser(function(user, cb) {
        cb(null, user.id);
    });

    passport.deserializeUser(function(id, cb) {
        var AccountModel = app.model.AccountModel;
        AccountModel.findById(id, function (err, user) {
            if (err) { return cb(err); }
            cb(null, user);
        });
    });

// passport.use(new LocalStrategy(Account.authenticate()));
    app.use(passport.initialize());
    app.use(passport.session());

});


app.use('/', index);
app.use('/users', users);
app.use('/register', register);
app.use('/account', accountRouter);

app.get('/detect-device', (req, res, next) => {
    console.log(`detect-device session user: ${req.user}`);

    if (req.device.type == config.deviceType.phone) {

        res.setHeader('Content-Type', 'application/json');
        var data = JSON.stringify({ device: req.device.type });
        res.status(200);
        res.send(data);

    } else if (req.device.type == config.deviceType.desktop) {

        res.send("under construction");
    } else {
        res.send("device: "  + req.device.type );
    }
});



app.get('/pushy', (req, res) => {
    var stream = res.push('/main.js', {
        status: 200, // optional
        method: 'GET', // optional
        request: {
            accept: '*/*'
        },
        response: {
            'content-type': 'application/javascript'
        }
    })
    stream.on('error', function() {
    })
    stream.end('alert("hello from push stream!");')


    res.end('<script src="/main.js"></script>')
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {

    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    if (req.device.type  == config.deviceType.desktop) {
        res.render('error');
    } else {
        var err = {
            code: (err.status || 500),
            name: err.message
        }
        utils.send_failure_json(res, err.code, err);
    }

});

//var nodemailer = require("nodemailer");
//test uncaughtException  happen
// setInterval(function () {
//
//   var err = utils.make_error(3434, 'abccc');
//   process.emit('uncaughtException', err);
//
// }, 2000);

process.on("uncaughtException", function(err) {


    let msg = (new Date()).toUTCString() + "\n\n" +
        err.message + "\n\n" +
        err.stack;
    if(config.domain == 'https://localhost:3000'){
        console.error(msg);
        process.exit(1);
    } else {
        utils.sendNotiEmailCrashWithMsg(msg, process);
    }

    if(process.env.NODE_ENV === "production")
    {

    }
    else
    {


    }
});


module.exports = app;


// simulate a request coming in every 5s, 1/10 chance of a crash
// while processing it
if(false){

    var waste_bin = [];

    setInterval(function () {

        var b = new Buffer(1000000);
        b.fill("x");
        waste_bin.push(b);

        console.log("got request" + new Date());
        var randomNum = Math.round(Math.random() * 10);

        if (randomNum == 1
            || randomNum == 2
            ||randomNum == 3
        ){
            throw new Error("SIMULATED CRASH!" + new Date());
        }
    }, 1000);

}
//fixes issue2-2