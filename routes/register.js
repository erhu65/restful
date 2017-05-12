/**
 * Created by peter on 01/04/2017.
 */
var config = require('../config.json');
var express = require('express');
const passport = require('passport');
const Account = require('../model/account');
const router = express.Router();
var utils = require('../helpers/utils');
var util = require('util');
var debuger = require('debug')('bonraybio:rounter/register');
var async = require('async');
const nodemailer = require('nodemailer');

router.get('/checkAccountExist',async function (req, res, next){
        try {
            var account;

            if (req.query.account) {
                account =  req.query.account;
            }

            if(!account) {
                let err = {};
                err.code = 400002;
                err.name = "account_required";
                return utils.send_failure_json(res, 400, err);
            }

            var AccountDetailModel = req.app.model.AccountDetailModel;
            let isExist = await AccountDetailModel.isExist(account);

            if(isExist){
                let resData = {isExist: true};
                return utils.send_success_json(res, null, resData);
            } else {
                let resData = {isExist: false};
                return utils.send_success_json(res, null, resData);

            }
        } catch(e) {

            let err = {};
            let status = e.status || 500;
            err.code = e.code || 500000;
            err.name = e.message || e.name ;
            if (e.desc) {
                err.desc = e.desc;
            }
            return utils.send_failure_json(res, status, err);
        }

});



router.post('/',
   (req, res, next) => {

    var AccountDetailModel = req.app.model.AccountDetailModel;
    var AccountProfileModel = req.app.model.AccountProfileModel;
    var AccountTokenModel = req.app.model.AccountTokenModel;

    var accountCreateData = {};
    accountCreateData.account = req.body.account;
    if(req.body.firstName){
        accountCreateData.firstName = req.body.firstName;
    }
    if(req.body.lastName) {
        accountCreateData.lastName = req.body.lastName;
    }

    accountCreateData.password = req.body.password;
    accountCreateData.gender = req.body.gender;

    if(req.body.spouse){
        accountCreateData.spouse = req.body.spouse;
    }
    if(req.body.birthday){

        accountCreateData.birthday =  new Date(parseInt(req.body.birthday));
    }
    if(req.body.height){
        accountCreateData.height = req.body.height;
    }
    if(req.body.weight){
        accountCreateData.weight = req.body.weight;
    }
    accountCreateData.who_standard = req.body.who_standard;
    if(req.body.apnsToken){
        accountCreateData.apnsToken = req.body.apnsToken;
    }

    if(req.body.is_allow_mutiple_device_login){
        accountCreateData.is_allow_mutiple_device_login = parseInt(req.body.is_allow_mutiple_device_login);
    }

    //debuger(`register / post body:${util.inspect(accountCreateData)}`);

    var validReportAccountDetail = AccountDetailModel.validationReport(accountCreateData);

    if(validReportAccountDetail){
        var err = config.response_error.params;
        err.desc = validReportAccountDetail;
        utils.send_failure_json(res, 400, err);
        return;
    }

    var addProfileData = {}
    if(req.body.profile) {
        addProfileData.account = accountCreateData.account;
        addProfileData.name = req.body.profile
    }

    var validateErrReportProfile = AccountProfileModel.validationReport(addProfileData)
    if (validateErrReportProfile){
        var err = config.response_error.params;
        err.desc = validateErrReportProfile;
        utils.send_failure_json(res, 400, err);
        return;
    }

    async.waterfall([
        function(callback) {
            //check if account exist?
            var cbOutter = callback;
            var queryData = {account:accountCreateData.account};
            AccountDetailModel.findOne(queryData, function (err, accountDetailModel) {
                if (err) {
                    return cbOutter(err);
                }
                if(accountDetailModel
                    && accountDetailModel.is_active == true){

                    var err = config.response_error.exist;
                    utils.send_failure_json(res, 500, err);
                    return;
                }
                cbOutter(null, accountDetailModel);
            });

        },
        function(accountDetailModel, callback) {
            var cbOutter = callback;
            if(accountDetailModel){

                AccountDetailModel.findByAccountAndUpdate(accountDetailModel.account, accountCreateData, function (err, accountDetailModel) {
                    if (err) {
                        return cbOutter(err);
                    }
                    cbOutter(null, accountDetailModel);
                });
            } else {

                var passwowrdEncrypt = utils.encrypt(accountCreateData.password);
                accountCreateData.password = passwowrdEncrypt;
                AccountDetailModel.createOneWithData(accountCreateData, function (err, accountDetailModel) {
                    if (err) {
                        return callback(err);
                    }
                    cbOutter(null, accountDetailModel);
                });
            }
        },
        function(accountDetailModel, callback) {

            if(addProfileData.name){
                accountDetailModel.updateProfile(addProfileData, function (err, _accountProfileModel) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, accountDetailModel);
                });

            } else {
                callback(null, accountDetailModel);
            }

        }], function (err, accountDetailModel) {
        if (err) {
            var err = config.response_error.server;
            err.desc = err;
            if (req.device.type  == config.deviceType.phone) {

                utils.send_failure_json(res, 500, err);
            } else if(req.device.type  == config.deviceType.desktop) {
                res.status(500);
                res.send(`post /register failed ${util.inspect(err)}`);
            }
            return;
        }

        // Use Smtp Protocol to send Email
        var smtpTransport = nodemailer.createTransport({
            service: config.nodemailer.service,
            host:config.nodemailer.host,
            port: config.nodemailer.port,
            auth: {
                user: config.nodemailer.auth.user,
                pass: config.nodemailer.auth.pass
            }
        });

        var mail = {
            from: `Bonraybio <${config.nodemailer.auth.user}>`,
            to:    accountDetailModel.account,
            subject: "Please Activate Your Accoun",
            //text: "Node.js New world for me",
            html: `<a href='${config.domain}/register/active?account=${accountDetailModel.account}&active_key=${encodeURIComponent(accountDetailModel.active_key)}&secret_key=${encodeURIComponent(config.secret_key)}'>Activate</a>`
        }

        smtpTransport.sendMail(mail, function(err, response){
            if(err){
                //debuger(`mail send err: ${util.inspect(err)}`);
            }
            //debuger(`mail send res: ${util.inspect(response)}`);
            smtpTransport.close();
        });

        if (req.device.type  == config.deviceType.phone) {
            accountDetailModel.getJsonData(function (err, jsonData) {
                if(err){
                    var err = config.response_error.server;
                    utils.send_failure_json(res, 500, err);
                    return;
                }
                return utils.send_success_json(res, null, jsonData);
            });
        }  else if (req.device.type  == config.deviceType.desktop) {
            accountDetailModel.getJsonData(function (err, jsonData) {
                if(err){
                    var err = config.response_error.server;
                    res.status(200);
                    res.send(`post /register failed ${util.inspect(err)}`);
                    return;
                }
                res.status(200);
                res.send(`post /register success ${util.inspect(err)}`);
            });
        } else {
            res.send("device: "  + req.device.type );
        }

    });

});


router.get('/active', (req, res, next) => {

    var AccountDetailModel = req.app.model.AccountDetailModel;

    var account = req.query.account;
    var active_key_encode = req.query.active_key;
    var active_key = decodeURIComponent(active_key_encode);

    //debuger(`req.query: ${util.inspect(req.query)}`);
    //debuger(`account ${util.inspect(account)}`);

    if(!account){
        var err = config.response_error.params;
        err.desc = "Account Required";
        utils.send_failure_json(res, 400, err);
        return;
    }

    if(!active_key){
        var err = config.response_error.params;
        err.desc = "active_key Required";
        utils.send_failure_json(res, 400, err);
        return;
    }

    async.waterfall([
        function(callback) {

            const cbOutter = callback;
            var queryData = {account:account};
            AccountDetailModel.findOne(queryData, function (err, accountDetailModel) {
                if (err) {
                    return cbOutter(err);
                }
                if(!accountDetailModel){
                    var err = {};
                    err.status = 401;
                    err.code = 401001;
                    err.name = "not_authorized";
                    return cbOutter(err);
                } else {
                    if(active_key != accountDetailModel.active_key){
                        var err = {};
                        err.status = 401;
                        err.code = 401001;
                        err.name = "not_authorized";
                        return cbOutter(err);
                    }
                    cbOutter(null, accountDetailModel);
                }
            });
        }, function(accountDetailModel, callback) {
            const cb2 = callback;
            var account = accountDetailModel.account;
            var password = accountDetailModel.password;

            if(accountDetailModel.is_active == false){
                accountDetailModel.enable(function (err ) {
                    if(err){
                        cb2(err);
                        return;
                    }
                    cb2(null, account, password, false);
                });
            } else {
                cb2(null, account, password, true);
            }
        }], function (error, account, password, isEverAddAccountAuth) {
            if (error) {
                var err = {};
                if(error.code && error.name){
                    err.code = error.code;
                    err.name = error.name;
                    if(error.desc){
                        err.desc = error.desc;
                    }
                } else {
                    err = config.response_error.server;
                }
                let status = error.status || 500
                utils.send_failure_json(res, status, err);
                return;
            }
            var isPhone = (req.device.type  == config.deviceType.phone);

            if(isEverAddAccountAuth){
                res.render('active_success', {isPhone: isPhone});
                return;
            }

            var passwowrdDecrypt = utils.decrypt(password);
            var AccountModel = req.app.model.AccountModel;

            AccountModel.register(new AccountModel({ account : account }), passwowrdDecrypt, (error, account) => {
                if (error) {
                    var err = config.response_error.server;
                    err.desc = "Add auth account error";
                    if(error.name){
                        err.name = error.name;
                    }
                    if(error.message){
                        err.desc = error.message;
                    }
                    utils.send_failure_json(res, 500, err);
                    return;
                    //return res.render('register', { error : err.message });
                }
                res.render('active_success', {isPhone: isPhone});
                return;
                //utils.send_success_json(res, null, {is_ok: true});
                //passport.authenticate('local')(req, res, () => {
                //
                //     req.session.save((err) => {
                //         if (err) {
                //             return next(err);
                //         }
                //         res.render('register/active_success', { user : req.user });
                //         //res.redirect('/');
                //     });
                // });
            });



    });
});



module.exports = router;
