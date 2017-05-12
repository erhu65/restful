var config = require('../config.json');
var express = require('express');
const passport = require('passport');
const Account = require('../model/account');
const router = express.Router();
var utils = require('../helpers/utils');
var util = require('util');
var debugRouter = require('debug')('bonraybio:rounter/index');


// a middleware function with no mount path. This code is executed for every request to the router
router.use(function (req, res, next) {
    if(req.body.account
        && req.originalUrl == "/login"){

        req.body.username = req.body.account;
        //delete  = req.body.account;
    }
    next()
})

router.get('/', (req, res) => {
    res.render('index', { user : req.user });
});

router.get('/register', (req, res) => {

    res.render('register', { });
});


// router.post('/register', (req, res, next) => {
//
//     //debugRouter(`app.model${util.inspect(req.app.model)}`);
//     res.send("device: ");
//     if (req.device.type  == config.deviceType.phone) {
//
//
//         var AccountDetailModel = req.app.model.AccountDetailModel;
//
//         res.setHeader('Content-Type', 'application/json');
//         var data = utils.jsonStringify({device: req.device.type});
//         res.status(200);
//         res.send(data);
//
//
//     } else if (req.device.type  == config.deviceType.desktop) {
//         var account = req.body.username;
//         var password = req.body.password;
//
//         Account.register(new Account({ account : account }), password, (err, account) => {
//         if (err) {
//             return res.render('register', { error : err.message });
//         }
//
//         passport.authenticate('local')(req, res, () => {
//             req.session.save((err) => {
//                 if (err) {
//                     return next(err);
//                 }
//                 res.redirect('/');
//             });
//         });
//         });
//     } else {
//         res.send("device: "  + req.device.type );
//     }
//
// });


router.get('/login', (req, res) => {
    res.render('login', { user : req.user, error : req.flash('error')});
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), (req, res, next) => {

    req.session.save(async function (err) {
        if (err) {
            return next(err);
        }
        let updateData = {
            latest_login_time:  new Date()
        };
        let AccountDetailModel = req.app.model.AccountDetailModel;
        let accountDetailModel = await AccountDetailModel.getBy_account(req.user.account);
        let accountDetailModelModified = await accountDetailModel.update(updateData);
        req.session.login_time = updateData.latest_login_time.getTime();
        res.redirect('/');
    });
});

router.get('/logout', (req, res, next) => {

  req.logout();
  req.session.save((err) => {
    if (err) {
        return next(err);
    }
    res.redirect('/');
  });

});

router.get('/ping', (req, res) => {
    res.status(200).send("pong!");
});


router.get('/protected_resource', isAuthenticated, (req, res, next) => {

  console.log("user: " + req.user);
  var data = JSON.stringify({ k: 'protected_resource' });

  res.status(200);
  res.setHeader('Content-Type', 'application/json');
  res.send(data);

});

router.get('/non_protected_resource', (req, res, next) => {

    var data = JSON.stringify({ k: 'non protected resource' });

    res.status(401);
    res.setHeader('Content-Type', 'application/json');
    res.send(data);

});

function isAuthenticated(req, res, next) {
    // do any checks you want to in here
    // CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
    // you can do this however you want with whatever variables you set up
    console.log("isAuthenticated, req.user:");
    console.log(req.user);

    if (req.user) {
        return next();
    } else {
        res.redirect('/login');
    }
}

module.exports = router;
