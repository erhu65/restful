/**
 * Created by peter on 03/04/2017.
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
const fs = require('fs');

let multer  = require('multer');
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.upload_tmp_path)
    },
    filename: function (req, file, cb) {
        let fileName = `${file.fieldname}-${Date.now()}.zip`;
        cb(null, fileName);
    }
});
let upload = multer({ storage: storage , limits: { fileSize: 1024 * 1024 * 20}});


// a middleware function with no mount path. This code is executed for every request to the router
router.use(function (req, res, next) {
    if(req.body.account
        && req.originalUrl == "/account/login"){

        req.body.username = req.body.account;
        //delete  = req.body.account;
    }
    next()
})

router.post('/login2',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res) {

    });

router.post('/login', function(req,res,next) {

        var req1 = req;
        var AccountDetailModel = req.app.model.AccountDetailModel;

        passport.authenticate('local', function (err, user) {
            var account = req.body.account;
            var password = req.body.password;

            //debuger(`account/login body:${util.inspect(req.body)}`);
            //debuger(`account/login user:${util.inspect(user)}`);
            if (user) {
                req1.session.save((err) => {
                    if (err) {
                        return next(err);
                    }
                    return next();
                });

            } else {
                if (!account) {
                    var err = config.response_error.params;
                    err.desc = "Account required";
                    return utils.send_failure_json(res, 400, err);
                }
                if (!password) {
                    var err = config.response_error.params;
                    err.desc = "Password required";
                    return utils.send_failure_json(res, 400, err);
                }

                var queryData = {account: account};
                AccountDetailModel.findOne(queryData, function (err, accountDetailModel) {
                    if (err) {
                        return next(err);
                    }
                    if (accountDetailModel) {
                        if (accountDetailModel.is_active == false
                            && accountDetailModel.password) {
                            let err = {
                                code: 900001,
                                name:'account_or_password_error'
                            }
                            return utils.send_failure_json(res, 900, err);
                        }

                        if (accountDetailModel.is_active == true
                            && !accountDetailModel.password) {
                            let err = {
                                code: 900003,
                                name:'account_or_password_error'
                            }
                            return utils.send_failure_json(res, 900, err);
                        }
                    }

                    if (!accountDetailModel) {
                        let err = {
                            code: 404001,
                            name:'account_not_exist'
                        }
                        return utils.send_failure_json(res, 400, err);
                    }
                });

            }

        })(req, res, next);
    }, passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
       (req, res, next) => {


        utils.send_success_json(res, null, {is_ok: true});
     });

router.post('/update', isAuthenticated,  async function(req,res,next) {

    try {

        let AccountDetailModel = req.app.model.AccountDetailModel;
        let AccountProfileModel = req.app.model.AccountProfileModel;

        var updateData = {};
        let accountModel = req.user;
        let accountDetailModel = await AccountDetailModel.getBy_account(req.user.account);

        if (req.body.newPassword) {
            updateData.newPassword =  req.body.newPassword;
        }
        if(req.body.newPasswordConfirm){
            updateData.newPasswordConfirm =  req.body.newPasswordConfirm;
        }

        if(updateData.newPassword  && !updateData.newPasswordConfirm ){
            let err = {};
            err.code = 400002;
            err.name = "newPasswordConfirm_required";
            return utils.send_failure_json(res, 400, err);
        }

        if(!updateData.newPassword  && updateData.newPasswordConfirm ){
            let err = {};
            err.code = 400002;
            err.name = "newPassword_required";
            return utils.send_failure_json(res, 400, err);
        }


        //update password of the acccount
        if (updateData.newPassword  && updateData.newPasswordConfirm) {
            if(updateData.newPassword != updateData.newPasswordConfirm) {
                let err = {};
                err.code = 400002;
                err.name = "newPassword_newPasswordConfirm_not_match";
                return utils.send_failure_json(res, 400, err);
            }
            //let AccountModel = req.app.model.AccountModel;
            await accountModel.updatePassword(updateData.newPassword);
        }
        delete updateData.newPassword;
        delete updateData.newPasswordConfirm;


        if(req.body.firstName){
            updateData.firstName = req.body.firstName;
        } else {
            updateData.firstName = accountDetailModel.firstName;
        }

        if(req.body.lastName) {
            updateData.lastName = req.body.lastName;
        } else {
            updateData.lastName = accountDetailModel.lastName;
        }

        if(req.body.spouse){
            updateData.spouse = req.body.spouse;
            let isExist = await AccountDetailModel.isExist(updateData.spouse);
            if(!isExist){
                let err = {};
                err.code = 404001;
                err.name = "spouse_not_found";
                return utils.send_failure_json(res, 404, err);
            }
            let accountDetailModelSpouse = await AccountDetailModel.getBy_account(updateData.spouse);
            let sposeUpdateData = {'spouse': req.user.account};
            await accountDetailModelSpouse.update(sposeUpdateData);

        } else {
            updateData.spouse = accountDetailModel.spouse;
        }


        if(req.body.birthday){
            updateData.birthday =  new Date(parseInt(req.body.birthday));
        } else {
            updateData.birthday = accountDetailModel.birthday;
        }

        if(req.body.height){
            updateData.height = req.body.height;
        } else {
            updateData.height = accountDetailModel.height;
        }

        if(req.body.weight){
            updateData.weight = req.body.weight;
        } else {
            updateData.weight = accountDetailModel.weight;
        }

        if(req.body.who_standard){
            updateData.who_standard = req.body.who_standard;
        } else {
            updateData.who_standard = accountDetailModel.who_standard;
        }

        if(req.body.apnsToken){
            updateData.apnsToken = req.body.apnsToken;
        }

        if(req.body.profile){
            updateData.profile = req.body.profile
        } else {
            updateData.profile = await accountDetailModel.profile();
        }

        if(req.body.is_allow_mutiple_device_login){
            updateData.is_allow_mutiple_device_login = parseInt(req.body.is_allow_mutiple_device_login);
        } else {
            updateData.is_allow_mutiple_device_login = await accountDetailModel.is_allow_mutiple_device_login;
        }

        if(updateData.profile){
            let profileData = {
                account: req.user.account,
                name: updateData.profile
            }
            let profileValidErrs = await AccountProfileModel.validate(profileData);
            if(profileValidErrs){
                let err = {};
                err.code = 400002;
                err.name = "profile_name_not_valid";
                err.errs = profileValidErrs;
                return utils.send_failure_json(res, 400, err);
            }
        }
        updateData.gender = accountDetailModel.gender;
        updateData.account = accountDetailModel.account;

        var validReportAccountDetail = AccountDetailModel.validationReport(updateData);

        if(validReportAccountDetail){
            var err = config.response_error.params;
            err.desc = validReportAccountDetail;
            utils.send_failure_json(res, 400, err);
            return;
        }
        let accountDetailModelModified = await accountDetailModel.update(updateData);

        //debuger(`register / post body:${util.inspect(accountCreateData)}`);
        let accountDetailJsonData = await accountDetailModelModified.getAccountJsonData();
        return utils.send_success_json(res, null, accountDetailJsonData);

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

router.get('/', async function(req,res,next) {

    try {

        let AccountDetailModel = req.app.model.AccountDetailModel;
        let accountDetailModel = await AccountDetailModel.getBy_account(req.user.account);
        let accountDetailJsonData = await accountDetailModel.getAccountJsonData();
        return utils.send_success_json(res, null, accountDetailJsonData);
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

let serial_images_base64_join_binary = upload.single('serial_images_base64_str_join_binary');

let uploadValidate =  function(req, res) {

    let ps = new Promise(async function(resolve, reject) {

        serial_images_base64_join_binary(req, res, function (err) {
            if (err) {
                err.code = 500000;
                return reject(err);
                //return utils.send_failure_json(res, 5000, error);
            } else {
                return resolve(null);
            }
        });

    });
    return ps;
}

router.put('/testItem', isAuthenticated, async function(req,res,next) {

    //debuger(`req.body: ${util.inspect(req.body)}`);
    try {
        //debuger(`req.files: ${util.inspect(req.files)}`);
        await uploadValidate(req,res);
        var tmpFilePath;

        if (req.file) {
            tmpFilePath = `${config.upload_tmp_path}/${req.file.filename}`;
        }

        let TestItemModel = req.app.model.TestItemModel;
        let AccountDetailModel = req.app.model.AccountDetailModel;

        var testItemData = {};

        if (req.body.account) {
           testItemData.account =  req.body.account;
        }

        if (req.body.cid_test_item) {
            testItemData.cid_test_item =  req.body.cid_test_item;
        }

        if (req.body.typeName) {
            testItemData.typeName =  req.body.typeName;
        }

        if (req.body.createDate && isNaN(req.body.createDate)  == false) {
            testItemData.createDate =  new Date(parseInt(req.body.createDate))
        }

        if (req.body.motility) {
            testItemData.motility =  req.body.motility;
        }

        if (req.body.morphology) {
            testItemData.morphology =  req.body.morphology;
        }

        if (req.body.concentraction) {
            testItemData.concentraction =  req.body.concentraction;
        }

        if (req.body.female_result) {
            testItemData.female_result =  req.body.female_result;
        }

        let errs = await TestItemModel.validationErrs(testItemData);

        if (errs && errs.length > 0) {
            let err = {};
            err.code = 400001;
            err.name = "params_error";
            err.errs = errs;
            if (req.file) {
                fs.unlinkSync(tmpFilePath);
            }
            return utils.send_failure_json(res, 400, err);
        }

        let testItemModelExist = await TestItemModel.getBy_cid_test_item(testItemData.cid_test_item);
        if (testItemModelExist) {
            if (req.file) {
                fs.unlinkSync(tmpFilePath);
            }
            let accountDetailModel = await AccountDetailModel.getOneByAccount(testItemData.account);
            let sid_profile = accountDetailModel.sid_profile;
            testItemData.sid_profile = sid_profile;
            testItemData.sid_test_item = testItemModelExist.sid_test_item;
            testItemData.is_repeat = 1;
            return utils.send_success_json(res, null, testItemData);
        }

        if(testItemData.typeName == 'sperm'
            && (!testItemData.motility
            || !testItemData.morphology
            || !testItemData.concentraction ) ) {

            let err = {};
            err.code = 400002;
            err.name = "all_sperm_results_required";
            if (req.file) {
                fs.unlinkSync(tmpFilePath);
            }
            return utils.send_failure_json(res, 400, err);
        }


        if((testItemData.typeName == 'LH'
            || testItemData.typeName == 'FSH'
                || testItemData.typeName == 'FSH'
            )
            && !testItemData.female_result) {

            let err = {};
            err.code = 400003;
            err.name = "female_result_required";
            if (req.file) {
                fs.unlinkSync(tmpFilePath);
            }
            return utils.send_failure_json(res, 400, err);
        }

        let accountDetailModel = await AccountDetailModel.getOneByAccount(testItemData.account);
        let sid_profile = accountDetailModel.sid_profile;
        testItemData.sid_profile = sid_profile;
        let testItemModel = await TestItemModel.createOneWithData(testItemData);
        testItemData.sid_test_item = testItemModel.sid_test_item;
        if (req.file) {

            let destFilePath = `${config.base64_join_path}/${req.file.filename}`;
            fs.createReadStream(tmpFilePath).pipe(fs.createWriteStream(destFilePath));
            let urlStr = `${config.base64_join_path}/${req.file.filename}`;

            let additionalFileData =  {
                sid_test_item:testItemModel.sid_test_item,
                url: urlStr
            };

            await testItemModel.addAdditionalFile(additionalFileData);

            delete testItemData.sid_profile;

            fs.unlinkSync(tmpFilePath);
        }
        let testItemAdded = await TestItemModel.getBy_cid_test_item(testItemData.cid_test_item);
        let testItemJson = await testItemAdded.getJsonData();
        utils.send_success_json(res, null, testItemJson);
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

router.get('/testItem', isAuthenticated, async function(req,res,next) {

    try {
        let cid_test_item;

        if (req.query.cid_test_item) {
            cid_test_item =  req.query.cid_test_item;
        }


        if(!cid_test_item) {
            let err = {};
            err.code = 400002;
            err.name = "cid_test_item_required";
            return utils.send_failure_json(res, 400, err);
        }


        let TestItemModel = req.app.model.TestItemModel;
        let testItemModel = await TestItemModel.getBy_cid_test_item(cid_test_item);
        if (!testItemModel) {
            let err = {};
            err.code = 404001;
            err.name = "not_found";
            return utils.send_failure_json(res, 404, err);
        }

        // debuger(`testItemModel.account:${util.inspect(testItemModel.account)}`);
        // debuger(`req.user.account:${util.inspect(req.user.account)}`);
        if(testItemModel.account != req.user.account) {
            let err = {};
            err.code = 401001;
            err.name = "not_authorized";
            return utils.send_failure_json(res, 401, err);
        }

        let jsonData = await testItemModel.getJsonData();
        utils.send_success_json(res, null, jsonData);

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

router.get('/testItem/images', isAuthenticated, async function(req,res,next) {

    try {

        let cid_test_item;
        if (req.query.cid_test_item) {
            cid_test_item =  req.query.cid_test_item;
        }

        if(!cid_test_item) {
            let err = {};
            err.code = 400002;
            err.name = "cid_test_item_required";
            return utils.send_failure_json(res, 400, err);
        }

        let TestItemModel = req.app.model.TestItemModel;
        let testItemModel = await TestItemModel.getBy_cid_test_item(cid_test_item);
        if (!testItemModel) {
            let err = {};
            err.code = 404001;
            err.name = "not_found";
            return utils.send_failure_json(res, 404, err);
        }

        // debuger(`testItemModel.account:${util.inspect(testItemModel.account)}`);
        // debuger(`req.user.account:${util.inspect(req.user.account)}`);

        if(testItemModel.account != req.user.account) {
            let err = {};
            err.code = 401001;
            err.name = "not_authorized";
            return utils.send_failure_json(res, 401, err);
        }

        let additionalFileModels = await testItemModel.getAllAdditionalFiles();

        if (additionalFileModels.length == 0){
            let err = {};
            err.code = 404001;
            err.name = "not_found";
            return utils.send_failure_json(res, 404, err);
        }

        let filePath = additionalFileModels[0].url;
        let base64str_join_by_60_images = fs.createReadStream(filePath);
        base64str_join_by_60_images.pipe(res);
        const stats = fs.statSync(filePath);
        res.header('content-length', stats.size);
        res.header("Content-Type", 'application/zip');
        base64str_join_by_60_images.on('end', function() {
            res.status(200)
            return res.end();
        });
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

router.get('/testItem/images/demo', async function(req,res,next) {

    try {
        const stats = fs.statSync('./test/api/tmp/test1.zip');
        debuger(`generateMore start ......`);
        let base64str_join_by_60_images = fs.createReadStream('./test/api/tmp/test1.zip');
        base64str_join_by_60_images.pipe(res);

        res.header( 'content-length', stats.size);
        res.header( 'content-Type', 'application/zip');
        base64str_join_by_60_images.on('end', function() {
            debuger(`generateMore end ......`);
            res.status(200)
            return res.end();
        });

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


router.get('/testItems', isAuthenticated, async function(req,res,next) {

    try {
        let account = req.user.account;

        let TestItemModel = req.app.model.TestItemModel;
        let testItemModels = await TestItemModel.getBy_account(account);

        var testItemModelsResArr = [];

        for (const testItemModel of testItemModels) {
            let jsonData = await testItemModel.getJsonData();
            testItemModelsResArr.push(jsonData);
        }

        utils.send_success_json(res, null, testItemModelsResArr);

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

router.get('/sync/testItem/me', isAuthenticated, async function(req,res,next) {

    try {
        let account = req.user.account;

        let server_create_time;

        if (req.query.server_create_time) {
            server_create_time =  req.query.server_create_time;
        }

        if(!server_create_time) {
            let err = {};
            err.code = 400002;
            err.name = "server_create_time_required";
            return utils.send_failure_json(res, 400, err);
        }

        let AccountDetailModel = req.app.model.AccountDetailModel;

        let accountDetailModel = await AccountDetailModel.getBy_account(account);
        let testItemModels = await accountDetailModel.getTestItems_after_some_time(server_create_time);

        var testItemModelsResArr = [];

        for (const testItemModel of testItemModels) {
            let jsonData = await testItemModel.getJsonData();
            testItemModelsResArr.push(jsonData);
        }
        utils.send_success_json(res, null, testItemModelsResArr);
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



router.get('/sync/testItem/spouse', isAuthenticated, async function(req,res,next) {

    try {
        let account = req.user.account;

        let server_create_time;

        if (req.query.server_create_time) {
            server_create_time =  req.query.server_create_time;
        }

        if(!server_create_time) {
            let err = {};
            err.code = 400002;
            err.name = "server_create_time_required";
            return utils.send_failure_json(res, 400, err);
        }

        let AccountDetailModel = req.app.model.AccountDetailModel;

        let accountDetailModel = await AccountDetailModel.getBy_account(account);
        let spouse = accountDetailModel.spouse;
        if(!spouse){
            let err = {};
            err.code = 404001;
            err.name = "spouse_not_found";
            return utils.send_failure_json(res, 404, err);
        }
        let accountDetailModelSpouse = await AccountDetailModel.getBy_account(spouse);
        let testItemModels = await accountDetailModelSpouse.getTestItems_after_some_time(server_create_time);

        var testItemModelsResArr = [];

        for (const testItemModel of testItemModels) {
            let jsonData = await testItemModel.getJsonData();
            testItemModelsResArr.push(jsonData);
        }
        utils.send_success_json(res, null, testItemModelsResArr);
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



router.get('/login',
    (req, res, next) => {
    //debuger(`account/login GET req.query: ${util.inspect(req.query)}`);

    if (req.device.type  == config.deviceType.phone) {

        var err = config.response_error.params;
        return utils.send_failure_json(res, 400, err);
    } else {
        res.redirect('/login');
    }

});


router.get('/logout', (req, res, next) => {

    req.logout();
    req.session.save((err) => {
        if (err) {
            return next(err);
        }

        if (req.device.type  == config.deviceType.desktop) {
             res.redirect('/');
        } else {
            let data  = {
                is_ok: true
            }
            utils.send_success_json(res, null, data);
        }

    });

});


router.get('/not_protected_resource', (req, res, next) => {

    var data = { k: 'not_protected_resource' }
    utils.send_success_json(res, null, data);

});

router.get('/protected_resource',isAuthenticated, (req, res, next) => {
    debuger(`account/protected_resource user user:${util.inspect(req.user)}`);

    var data = { k: 'protected_resource' };
    utils.send_success_json(res, null, data);


});

function  isAuthenticated(req, res, next) {
    // do any checks you want to in here
    // CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
    // you can do this however you want with whatever variables you set up
    //debuger(`isAuthenticated, req.session:${util.inspect(req.session)}`);


    //debuger(`isAuthenticated, req.user:${util.inspect(req.user)}`);
    //debuger(`isAuthenticated, req.isAuthenticated():${util.inspect(req.isAuthenticated())}`);
    if (req.user) {

        let AccountDetailModel = req.app.model.AccountDetailModel;
        let p =  AccountDetailModel.getBy_account(req.user.account);

        p.then(function(accountDetailModel) {
            let latest_login_time = accountDetailModel.latest_login_time;
            if(latest_login_time){
                let login_time_date = new Date(req.session.login_time);
                let is_allow_mutiple_device_login = accountDetailModel.is_allow_mutiple_device_login;
                //debuger(`isAuthenticated, login_time:       ${util.inspect(login_time_date)}`);
                //debuger(`isAuthenticated, latest_login_time:${util.inspect(latest_login_time)}`);

                if (req.session.login_time < latest_login_time.getTime()
                    && is_allow_mutiple_device_login == false
                ) {
                    debuger(`not allow mutiple device loing happen`);
                    return res.redirect('logout');
                }
            }
            return next();
        });
    } else {
        if (req.device.type  == config.deviceType.phone) {
            var err = config.response_error.permission.no_session;
            return utils.send_failure_json(res, 401, err);
        } else {
            res.redirect('/login');
        }

    }
}

module.exports = router;