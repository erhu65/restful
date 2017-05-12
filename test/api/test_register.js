/**
 * Created by peter on 30/03/2017.
 */
var debuger = require('debug')('bonraybio:test_register');
var util = require('util');
var utils = require('../../helpers/utils');
const assert = require('assert');
const expect = require('chai').expect;
var should = require('should');
var async = require('async');
var request = require('request');
var cookieJar = request.jar();
const AdmZip = require('adm-zip');

var mongoosePrepare = require('../../model/mongoosePrepare');

var fs = require('fs')
    , path = require('path')
    , caFile= path.resolve(__dirname, '../../ssl/server.includesprivatekey.pem')

var bonrayboi = require('../../model/bonraybio');
var mongoose;
var config = require('../../config.json');
var connectUrl = `mongodb://${config.mongodb.server}:27017/${config.mongodb.db}`;
var AccountDetailModel;
var AccountModel;

var testAccount= 'erhu65@gmail.com';

var options = {
    db: {native_parser: true},
    replset:{rs_name: 'myReplicaSetName'},
    user: config.mongodb.user,
    pass: config.mongodb.pass,
    auth:{
        authdb: 'admin'
    }
};

before(function(done) {
    console.log('before');
    //return done();
    mongoosePrepare.init(connectUrl, options, function (err, mongooseConnected) {

        if(err) throw  Error('mongoose connect err');
        mongoose = mongooseConnected;
        bonrayboi.initWithConnection(mongooseConnected);
        AccountDetailModel = bonrayboi.AccountDetailModel;
        AccountModel = bonrayboi.AccountModel;

        if (mongooseConnected.connection.readyState === 0) {

            mongooseConnected.connect(connectUrl, options, function (err) {
                if (err) {
                    throw err;
                }
                return clearDatabase();
            });

        } else {
            return clearDatabase();
        }

        function clearDatabase() {
            for (var i in mongooseConnected.connection.collections) {
                mongooseConnected.connection.collections[i].remove(function() {});
            }
            utils.rmDir('./public/tmp/uploads');
            utils.rmDir('./private/base64_join');
            utils.rmDir(__dirname + '/base64_images_decode');

            return done();
        }
    });

});

after(function(done) {
    console.log('after');
    //return done();
    mongoose.disconnect();
    return done();
    // runs after all tests in this block
});


beforeEach(function (done) {
    console.log('beforeEach');
    return done();
});


afterEach(function (done) {
    console.log('afterEach');

    return done();
});

var baseRequest = request.defaults({
    headers: {'user-agent': 'phone',
        'secret_key': config.secret_key},
    ca: caFile,
    rejectUnauthorized: false,
    jar: cookieJar
});



let reisterUser = function(newUser) {


    let ps = new Promise(async function(resolve, reject) {
        const options = {
            url: `${config.domain}/register`,
            method: 'POST',
            form: {
                account: newUser,
                firstName: 'Peter',
                lastName: 'Huang',
                password: 'lq2;A49sdf9*ow7A@a',
                gender: 1,
                profile: 'contraception',
                birthday: 323790993000,
                who_standard: 5,
                apnsToken: 'XXXXXXX',
                height: 160,
                weight: 56,
                is_allow_mutiple_device_login: 0
            }
        };
        var request = baseRequest.defaults();
        request(options, function (err, httpResponse, body) {
            if (err) {
                return reject(err);
            }
            const resObj = utils.jsonParse(body);
            //debuger(`resObj:${util.inspect(resObj)}`);

            assert.equal(httpResponse.statusCode, 200);
            assert.equal(resObj.error, null);
            assert.equal(resObj.data.account, newUser);
            assert.equal(resObj.data.firstName, 'Peter');
            assert.equal(resObj.data.profile, 'contraception');
            assert.equal(resObj.data.who_standard, '5');
            return resolve();
        });
    });
    return ps;
}

let enableRegisterUser = function(newUser) {
    let ps = new Promise(async function(resolve, reject) {
        var dataQuery = {account: newUser};

        AccountDetailModel.findOne(dataQuery, function (err, accountDetailModel) {
            if (err) {
                return reject(err);
            }
            const options = {
                url: `${config.domain}/register/active?account=${accountDetailModel.account}&active_key=${encodeURIComponent(accountDetailModel.active_key)}&secret_key=${encodeURIComponent(config.secret_key)}`,
                method: 'GET'
            };
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return reject(err);
                }
                //const resObj = utils.jsonParse(body);
                //debuger(`resObj4:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 200);
                //assert.equal(resObj.data.is_ok, true);
                return resolve();
            });

        });
    });
    return ps;
}

let loginUser = function(newUser) {
    let ps = new Promise(async function(resolve, reject) {

        const options = {
            url: `${config.domain}/account/login`,
            method: 'POST',
            form: {
                account: newUser,
                password: 'lq2;A49sdf9*ow7A@a'
            }};
        var request = baseRequest.defaults();
        request(options, function(err, httpResponse, body){
            if(err){
                return reject(err);
            }
            const resObj = utils.jsonParse(body);

            assert.equal(httpResponse.statusCode, 200);
            assert.equal(resObj.data.is_ok, true);
            return resolve();
        });

    });
    return ps;
}

let loginUserWithPwd = function(newUser, pwd) {
    let ps = new Promise(async function(resolve, reject) {

        const options = {
            url: `${config.domain}/account/login`,
            method: 'POST',
            form: {
                account: newUser,
                password: pwd
            }};
        var request = baseRequest.defaults();
        request(options, function(err, httpResponse, body){
            if(err){
                return reject(err);
            }
            const resObj = utils.jsonParse(body);

            assert.equal(httpResponse.statusCode, 200);
            assert.equal(resObj.data.is_ok, true);
            return resolve();
        });

    });
    return ps;
}

let changePasswordSuccess = function(password) {

    let ps = new Promise(async function(resolve, reject) {

        var options = {
            url: `${config.domain}/account/update`,
            method: 'POST',
            form: {newPassword: password,
                newPasswordConfirm: password,
                apnsToken: 'apnstoken2',
                profile: 'medication',
                is_allow_mutiple_device_login: 1,
                height: 22}
        };
        var request = baseRequest.defaults();

        request(options, function(err, httpResponse, body){
            if(err){
                return reject(err);
            }
            const resObj = utils.jsonParse(body);
            //debuger(`/account/testItem body:${util.inspect(body)}`);
            expect(httpResponse.statusCode).to.equal(200);
            expect(resObj.data).to.have.all.keys('account', 'apnsTokens', 'firstName', 'gender', 'height', 'lastName', 'profile', 'weight', 'who_standard', 'spouse', 'fullName', 'is_allow_mutiple_device_login');
            expect(resObj.data.apnsTokens).to.be.a('array');
            expect(resObj.data.apnsTokens).to.include("XXXXXXX");
            expect(resObj.data.apnsTokens).to.include("apnstoken2");
            expect(resObj.data.profile).to.equal("medication");
            expect(resObj.data.height).to.equal(22);
            expect(resObj.data.is_allow_mutiple_device_login).to.equal(true);
            return resolve(resObj);
        });
    });
    return ps;
}

describe('register/login/testItem', function () {

    describe('register', function () {

        it('Should detect secret key not valid', function (done) {

            const options = {
                url: `${config.domain}/register/`,
                headers: {'user-agent': 'phone'},
                method: 'POST',
                ca: caFile,
                rejectUnauthorized: false
            };
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                assert.equal(httpResponse.statusCode, 401);
                assert.equal(resObj.name , 'no_secret_key');
                assert.equal(resObj.code , 401000);
                // debug(`err:${util.inspect(err)}`);
                // debug(`httpResponse.statusCode:${util.inspect(httpResponse.statusCode)}`);
                // debug(`resObj:${util.inspect(resObj)}}`);
                return done();
            });

        });

        it('Should detect account has not been actived', async function () {

            let accountHasNotBeenUse = function() {

                let ps = new Promise(async function(resolve, reject) {

                    var propertiesObject = {account:"erhu65@gmail.com"};
                    var options = {
                        url: `${config.domain}/register/checkAccountExist`,
                        method: 'GET',
                        qs: propertiesObject
                    }

                    var request = baseRequest.defaults();

                    request(options, function(err, httpResponse, body){
                        if(err){
                            return reject(err);
                        }
                        const resObj = utils.jsonParse(body);
                        //debuger(`/account/testItem body:${util.inspect(body)}`);
                        expect(httpResponse.statusCode).to.equal(200);
                        expect(resObj.data.isExist).to.equal(false);
                        return resolve(resObj);
                    });
                });
                return ps;
            }
            await accountHasNotBeenUse();
        });

        it('Should detect accountDetail validation error before add accountDetail', function (done) {
            const options = {
                url: `${config.domain}/register`,
                method: 'POST',
                form: {
                    account: 'petet.bonray.com',
                    firstName: 'Peter',
                    lastName: 'Huang',
                    password: 'lq2;A49sdf9*ow7A@a',
                    gender:1,
                    profile:'aa',
                    birthday:315532800,
                    who_standard:8
                }
            };
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }

                //debug(`body:${util.inspect(body)}`);
                const resObj = utils.jsonParse(body);
                assert.equal(httpResponse.statusCode, 400);
                assert.equal(resObj.code, 400001);
                assert.equal(resObj.name, 'params_error');
                assert.equal(resObj.desc, "`8` is not a valid enum value for path `who_standard`.\npetet.bonray.com is not a valid email");

                return done();
            });
        });

        it('Should detect profile validation error before add accountDetail', function (done) {
            const options = {
                url: `${config.domain}/register`,
                method: 'POST',
                form: {
                    account: testAccount,
                    firstName: 'Peter',
                    lastName: 'Huang',
                    password: 'lq2;A49sdf9*ow7A@a',
                    gender:1,
                    profile:'aa',
                    birthday:315532800,
                    who_standard:5
                }
            };
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`resObj:${util.inspect(resObj)}`);
                assert.equal(httpResponse.statusCode, 400);
                assert.equal(resObj.code, 400001);
                assert.equal(resObj.name, 'params_error');
                assert.equal(resObj.desc, "`aa` is not a valid enum value for path `name`.");

                return done();
            });
        });

        // it('Should  login fail because Account not exist', function (done) {
        //     const options = {
        //         url: `${config.domain}/account/login`,
        //         method: 'POST',
        //         form: {
        //             account: 'pete2r@bonray.com',
        //             password: 'lq2;A49sdf9*ow7A@a'
        //         }
        //     };
        //     var request = baseRequest.defaults();
        //     request(options, function(err, httpResponse, body){
        //         if(err){
        //             return done(err);
        //         }
        //         const resObj = utils.jsonParse(body);
        //         //debuger(`resObj4:${util.inspect(resObj)}`);
        //
        //         assert.equal(httpResponse.statusCode, 404);
        //         assert.equal(resObj.code, 404001);
        //         assert.equal(resObj.name, 'not_found');
        //         assert.equal(resObj.desc, 'Account not exist');
        //         return done();
        //     });
        // });

        it('Should  add accountDetail successfully with profile and apns token and send active email', function (done) {
            const options = {
                url: `${config.domain}/register`,
                method: 'POST',
                form: {
                    account: testAccount,
                    firstName: 'Peter',
                    lastName: 'Huang',
                    password: 'lq2;A49sdf9*ow7A@a',
                    gender:1,
                    profile:'contraception',
                    birthday:323790993000,
                    who_standard:5,
                    apnsToken:'XXXXXXX',
                    height:160,
                    weight:56
                }
            };
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`resObj:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 200);
                assert.equal(resObj.error, null);
                assert.equal(resObj.data.account, testAccount);
                assert.equal(resObj.data.firstName, 'Peter');
                assert.equal(resObj.data.profile, 'contraception');
                assert.equal(resObj.data.who_standard, '5');
                expect(resObj.data.fullName).to.equal('Peter Huang');
                return done();
            });

        });


        it('Should  login fail because Account not active', function (done) {
            const options = {
                url: `${config.domain}/account/login`,
                method: 'POST',
                form: {
                    account: testAccount,
                    password: 'lq2;A49sdf9*ow7A@a'
                }
            };
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`resObj4:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 900);
                assert.equal(resObj.code, 900001);
                assert.equal(resObj.name, 'account_not_active');
                return done();
            });
        });

        it('Should enable account failure-> params error', function (done) {

            var dataQuery = {account: testAccount};
            AccountDetailModel.findOne(dataQuery, function (err, accountDetailModel) {
                if (err) {
                    return done(err);
                }
                const options = {
                    url: `${config.domain}/register/active?active_key=${encodeURIComponent(accountDetailModel.active_key)}&secret_key=${encodeURIComponent(config.secret_key)}`,
                    method: 'GET'
                };
                var request = baseRequest.defaults();
                request(options, function(err, httpResponse, body){
                    if(err){
                        return done(err);
                    }
                    const resObj = utils.jsonParse(body);

                    //debuger(`resObj1:${util.inspect(resObj)}`);
                    assert.equal(httpResponse.statusCode, 400);
                    assert.equal(resObj.code, 400001);
                    assert.equal(resObj.name, 'params_error');
                    return done();
                });

            });
        });

        it('Should enable account failure -> account not register', function (done) {

            const options = {
                url: `${config.domain}/register/active?account=aa@gmail.com&active_key=aaabbbccc}&secret_key=${encodeURIComponent(config.secret_key)}`,
                method: 'GET'
            };
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`resObj2:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 401);
                assert.equal(resObj.code, 401001);
                assert.equal(resObj.name, "not_authorized");
                return done();
            });

        });

        it('Should enable account failure -> active_key not valid', function (done) {

            var dataQuery = {account: testAccount};

            AccountDetailModel.findOne(dataQuery, function (err, accountDetailModel) {
                if (err) {
                    return nodes(err);
                }
                const options = {
                    url: `${config.domain}/register/active?account=${accountDetailModel.account}&active_key=aaabbbccc}&secret_key=${encodeURIComponent(config.secret_key)}`,
                    method: 'GET'
                };
                var request = baseRequest.defaults();
                request(options, function(err, httpResponse, body){
                    if(err){
                        return done(err);
                    }
                    const resObj = utils.jsonParse(body);
                    //debuger(`resObj3:${util.inspect(resObj)}`);

                    assert.equal(httpResponse.statusCode, 401);
                    assert.equal(resObj.code, 401001);
                    assert.equal(resObj.name, "not_authorized");
                    return done();
                });

            });

        });

        it('Should enable account successfully', function (done) {
            var dataQuery = {account: testAccount};

            AccountDetailModel.findOne(dataQuery, function (err, accountDetailModel) {
                if (err) {
                    return nodes(err);
                }
                const options = {
                    url: `${config.domain}/register/active?account=${accountDetailModel.account}&active_key=${encodeURIComponent(accountDetailModel.active_key)}&secret_key=${encodeURIComponent(config.secret_key)}`,
                    method: 'GET'
                };
                var request = baseRequest.defaults();
                request(options, function(err, httpResponse, body){
                    if(err){
                        return done(err);
                    }
                    //const resObj = utils.jsonParse(body);
                    //debuger(`resObj4:${util.inspect(resObj)}`);

                    assert.equal(httpResponse.statusCode, 200);
                    //assert.equal(resObj.data.is_ok, true);
                    return done();
                });

            });

        });

        it('Should detect account has been actived', async function () {

            let accountHasBeenUse = function() {

                let ps = new Promise(async function(resolve, reject) {

                    var propertiesObject = {account:"erhu65@gmail.com"};
                    var options = {
                        url: `${config.domain}/register/checkAccountExist`,
                        method: 'GET',
                        qs: propertiesObject
                    }

                    var request = baseRequest.defaults();
                    request(options, function(err, httpResponse, body){
                        if(err){
                            return reject(err);
                        }
                        const resObj = utils.jsonParse(body);
                        //debuger(`${arguments.callee.name}:${util.inspect(body)}`);
                        expect(httpResponse.statusCode).to.equal(200);
                        expect(resObj.data.isExist).to.equal(true);
                        return resolve(resObj);
                    });
                });
                return ps;
            }
            await accountHasBeenUse();
        });

        it('Should check account exist in auth collection', async function () {

            let accountModel = await AccountModel.getBy_account('erhu65@gmail.com');
            assert.equal(accountModel.account, 'erhu65@gmail.com');
        });


        it('Should  add accountDetail fail, because account has been exist and acitve', function (done) {
            const options = {
                url: `${config.domain}/register`,
                method: 'POST',
                form: {
                    account: testAccount,
                    firstName: 'Peter2',
                    lastName: 'Huang',
                    password: 'lq2;A49sdf9*ow7A@a',
                    gender:1,
                    profile:'contraception',
                    birthday:315532800,
                    who_standard:5,
                    apnsToken:'XXXXXXX'
                }
            };
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                assert.equal(httpResponse.statusCode, 500);
                assert.equal(resObj.code, 500002);
                assert.equal(resObj.name, 'data_exist');
                return done();
            });

        });

    })

    describe('login', function () {

        it('Should  login fail because Account Reqiuired', function (done) {
            const options = {
                url: `${config.domain}/account/login`,
                method: 'POST',
                form: {
                    //account: testAccount,
                    password: 'lq2;A49sdf9*ow7A@a'
                }
            };
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`resObj4:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 400);
                assert.equal(resObj.code, 400001);
                assert.equal(resObj.name, 'params_error');
                assert.equal(resObj.desc, 'Account required');
                return done();
            });
        });

        it('Should  login fail because Password Reqiuired', function (done) {
            const options = {
                url: `${config.domain}/account/login`,
                method: 'POST',
                form: {
                    account: testAccount,
                    //password: 'lq2;A49sdf9*ow7A@a'
                }
            };
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`resObj4:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 400);
                assert.equal(resObj.code, 400001);
                assert.equal(resObj.name, 'params_error');
                assert.equal(resObj.desc, 'Password required');
                return done();
            });
        });

        it('Should  login faile because password not right', function (done) {
            const options = {
                url: `${config.domain}/account/login`,
                method: 'POST',
                form: {
                    account: testAccount,
                    password: 'jfkdls88'
                }
            };
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`resObj4:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 900);
                assert.equal(resObj.code, 900003);
                assert.equal(resObj.name, 'password_not_match');
                return done();
            });
        });

        it('Should  access protected resources failed -> no session', function (done) {
            const options = {
                url: `${config.domain}/account/protected_resource`,
                method: 'GET',
            };
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`resObj4:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 401);
                assert.equal(resObj.name, 'no_session');
                assert.equal(resObj.code, 401002);
                return done();
            });
        });

        it('Should  access non protected resources successfully', function (done) {
            const options = {
                url: `${config.domain}/account/not_protected_resource`,
                method: 'GET',
            };
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`resObj4:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 200);
                assert.equal(resObj.data.k, 'not_protected_resource');

                return done();
            });
        });

        it('Should login successfully', function (done) {
            const options = {
                url: `${config.domain}/account/login`,
                method: 'POST',
                form: {
                    account: testAccount,
                    password: 'lq2;A49sdf9*ow7A@a'
                }};
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //var cookie_string = cookieJar.getCookieString(`${config.domain}/account/login`); // "key1=value1; key2=value2; ..."
                //var cookies = cookieJar.getCookies(`${config.domain}/account/login`);
                //debuger(`/account/login cookies:${util.inspect(cookies)}`);

                assert.equal(httpResponse.statusCode, 200);
                assert.equal(resObj.data.is_ok, true);
                return done();
            });
        });

        it('Should  access protected resources successfully', function (done) {
            const options = {
                url: `${config.domain}/account/protected_resource`,
                method: 'GET'};

            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                //debuger(`/account/protected_resource body:${util.inspect(body)}`);

                //var cookie_string = cookieJar.getCookieString(`${config.domain}/account/protected_resource`); // "key1=value1; key2=value2; ..."
                //var cookies = cookieJar.getCookies(`${config.domain}/account/protected_resource`);
                //debuger(`/account/protected_resource cookies:${util.inspect(cookies)}`);

                const resObj = utils.jsonParse(body);
                //debuger(`resObj4:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 200);
                assert.equal(resObj.data.k, 'protected_resource');

                return done();
            });
        });

        it('Should  logout successfully', function (done) {
            const options = {
                url: `${config.domain}/account/logout`,
                method: 'GET'
            };
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`resObj4:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 200);
                assert.equal(resObj.data.is_ok, true);
                return done();
            });
        });


        it('Should login successfully again', function (done) {
            const options = {
                url: `${config.domain}/account/login`,
                method: 'POST',
                form: {
                    account: testAccount,
                    password: 'lq2;A49sdf9*ow7A@a'
                }};
            var request = baseRequest.defaults();
            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //var cookie_string = cookieJar.getCookieString(`${config.domain}/account/login`); // "key1=value1; key2=value2; ..."
                //var cookies = cookieJar.getCookies(`${config.domain}/account/login`);
                //debuger(`/account/login cookies:${util.inspect(cookies)}`);

                assert.equal(httpResponse.statusCode, 200);
                assert.equal(resObj.data.is_ok, true);
                return done();
            });
        });


    });



        describe("testItem", function () {

        it('Should valid addTestItem fail -> validatioin fail..-> typeName not right', function (done) {

            var options = {
                url: `${config.domain}/account/testItem`,
                method: 'PUT',
                form: {
                    account: testAccount,
                    createDate: 324738700000,
                    cid_test_item: "123456",
                    typeName: 'XXX'
                }};

            var request = baseRequest.defaults();

            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //var cookie_string = cookieJar.getCookieString(`${config.domain}/account/login`); // "key1=value1; key2=value2; ..."
                //var cookies = cookieJar.getCookies(`${config.domain}/account/login`);
                //debuger(`/account/testItem body:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 400);
                assert.equal(resObj.name, "params_error");
                assert.equal(resObj.code, 400001);
                assert.equal(resObj.errs[0], "`XXX` is not a valid enum value for path `typeName`.");
                return done();
            });
        });

        it('Should valid addTestItem fail -> validatioin fail..-> createDate required', function (done) {

            var options = {
                url: `${config.domain}/account/testItem`,
                method: 'PUT',
                form: {
                    account: testAccount,
                    //createDate: 324738700000,
                    cid_test_item: "123456",
                    typeName: 'sperm'
                }};

            var request = baseRequest.defaults();

            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //var cookie_string = cookieJar.getCookieString(`${config.domain}/account/login`); // "key1=value1; key2=value2; ..."
                //var cookies = cookieJar.getCookies(`${config.domain}/account/login`);
                //debuger(`/account/testItem body:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 400);
                assert.equal(resObj.name, "params_error");
                assert.equal(resObj.code, 400001);
                assert.equal(resObj.errs[0], "createDate required");
                return done();
            });
        });


        it('Should add male addTestItem fail -> no motility(or morphology, concentraction)',  function (done) {


            // var base64Images = [];
            // for (var i = 1; i <= 60; i++ ){
            //     let numStr = utils.pad(i, 3);
            //     // convert image to base64 encoded string
            //     var base64str = utils.base64_encode(__dirname + `/MotilityImage/${numStr}.jpg`);
            //     base64Images.push(base64str);
            // }
            // let serial_images_base64_str_join = base64Images.join("-bonrarybio-");
            // var serial_images_base64_str_join_binary = stringer(serial_images_base64_str_join);
            // var txtFile = fs.createWriteStream(__dirname + `/tmp/test1.zip`);
            // txtFile.write(serial_images_base64_str_join);
            //txtFile.end();
            //debuger(`test1.zip eixst:?2 => ${util.inspect(fs.existsSync(__dirname + `/tmp/test1.zip`))}`);
            var serial_images_base64_str_join_binary = fs.createReadStream(__dirname + `/tmp/test1.zip`);
            //run time轉完base64再 join，存成檔案，再createReadStream　拿回來，當成檔案上傳，檔案太大會容易失敗，
            //但直接拿不會有問題

            var formData = {
                account: testAccount,
                createDate: 324738700000,
                cid_test_item: "123456",
                typeName: 'sperm',
                //images: images,
                serial_images_base64_str_join_binary: serial_images_base64_str_join_binary,
                morphology: 0.3
            };

            var options = {
                url: `${config.domain}/account/testItem`,
                method: 'PUT',
                formData
            };

            var request = baseRequest.defaults();

            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`/account/testItem body:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 400);
                assert.equal(resObj.code, 400002);
                assert.equal(resObj.name, 'all_sperm_results_required');
                done();
            });

        });

        var base64_join_url;
        it('Should add male TestItem with 60 images successfully ',  function (done) {

            // var base64Images = [];
            // for (var i = 1; i <= 60; i++ ){
            //     let numStr = utils.pad(i, 3);
            //     // convert image to base64 encoded string
            //     var base64str = utils.base64_encode(__dirname + `/MotilityImage/${numStr}.jpg`);
            //     base64Images.push(base64str);
            // }
            // let serial_images_base64_str_join = base64Images.join("-bonrarybio-");
            // var serial_images_base64_str_join_binary = stringer(serial_images_base64_str_join);
            // var txtFile = fs.createWriteStream(__dirname + `/tmp/test1.zip`);
            // txtFile.write(serial_images_base64_str_join);
            // txtFile.end();
            //debuger(`test1.zip eixst:? => ${util.inspect(fs.existsSync(__dirname + `/tmp/test1.zip`))}`);
            var serial_images_base64_str_join_binary = fs.createReadStream(__dirname + `/tmp/test1.zip`);

            var formData = {
                account: testAccount,
                createDate: 324738700000,
                cid_test_item: "123456",
                typeName: 'sperm',
                serial_images_base64_str_join_binary: serial_images_base64_str_join_binary,
                //images: images,
                motility:0.1,
                morphology:0.2,
                concentraction:0.3
            };

            var options = {
                url: `${config.domain}/account/testItem`,
                method: 'PUT',
                formData
            };

            var request = baseRequest.defaults();

            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`/account/testItem body:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 200);
                assert.equal(resObj.data.typeName, 'sperm');
                assert.equal(resObj.data.concentraction, 0.3);
                assert.equal(resObj.data.morphology, 0.2);
                assert.equal(resObj.data.motility, 0.1);
                assert.equal(resObj.data.url, undefined);
                assert.equal((typeof resObj.data.sid_test_item  === 'string'), true, 'sid_test_item should have value as string');
                assert.equal(resObj.data.cid_test_item , "123456");
                base64_join_url = resObj.data.url;
                return done();
            });
        });


        it('Should add male TestItem  with 60 images fail -> detect cid repeat',  function (done) {

            var serial_images_base64_str_join_binary = fs.createReadStream(__dirname + `/tmp/test1.zip`);

            var formData = {
                account: testAccount,
                createDate: 324738700000,
                cid_test_item: "123456",
                typeName: 'sperm',
                serial_images_base64_str_join_binary: serial_images_base64_str_join_binary,
                //images: images,
                motility:0.1,
                morphology:0.2,
                concentraction:0.3
            };

            var options = {
                url: `${config.domain}/account/testItem`,
                method: 'PUT',
                formData
            };

            var request = baseRequest.defaults();

            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`/account/testItem body:${util.inspect(resObj)}`);
                assert.equal(httpResponse.statusCode, 200);
                assert.equal(resObj.data.typeName, 'sperm');
                assert.equal(resObj.data.concentraction, 0.3);
                assert.equal(resObj.data.morphology, 0.2);
                assert.equal(resObj.data.motility, 0.1);
                assert.equal(resObj.data.url, undefined);
                assert.equal((typeof resObj.data.sid_test_item  === 'string'), true, 'sid_test_item should have value as string');
                assert.equal(resObj.data.cid_test_item , "123456");
                expect(resObj.data.is_repeat).to.equal(1);
                return done();
            });
        });

        it('Should add female TestItem  FSH failed without female_result', function (done) {

            var formData = {
                account: testAccount,
                createDate: 351738700000,
                cid_test_item: "65432190",
                typeName: 'FSH'
            };

            var options = {
                url: `${config.domain}/account/testItem`,
                method: 'PUT',
                formData
            };

            var request = baseRequest.defaults();

            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //var cookie_string = cookieJar.getCookieString(`${config.domain}/account/login`); // "key1=value1; key2=value2; ..."
                //var cookies = cookieJar.getCookies(`${config.domain}/account/login`);
                //debuger(`/account/testItem body:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 400);
                assert.equal(resObj.code , 400003);
                assert.equal(resObj.name , 'female_result_required');
                return done();
            });

        });

        it('Should add female TestItem  FSH success', function (done) {

            var formData = {
                account: testAccount,
                createDate: 351738700001,
                cid_test_item: "65432191",
                typeName: 'FSH',
                female_result:0.99
            };

            var options = {
                url: `${config.domain}/account/testItem`,
                method: 'PUT',
                formData
            };

            var request = baseRequest.defaults();

            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //var cookie_string = cookieJar.getCookieString(`${config.domain}/account/login`); // "key1=value1; key2=value2; ..."
                //var cookies = cookieJar.getCookies(`${config.domain}/account/login`);
                //debuger(`/account/testItem body:${util.inspect(resObj)}`);
                assert.equal(httpResponse.statusCode, 200);
                assert.equal(resObj.data.female_result , 0.99);
                assert.equal(resObj.data.typeName , 'FSH');
                return done();
            });

        });

        it('Should add female TestItem  HCG with a image successfully', function (done) {

            var serial_images_base64_str_join_binary = fs.createReadStream(__dirname + `/tmp/test2.zip`);

            var formData = {
                account: testAccount,
                createDate: 351738700001,
                cid_test_item: "65432194",
                typeName: 'HCG',
                female_result:0.98,
                serial_images_base64_str_join_binary:serial_images_base64_str_join_binary
            };

            var options = {
                url: `${config.domain}/account/testItem`,
                method: 'PUT',
                formData
            };

            var request = baseRequest.defaults();

            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //var cookie_string = cookieJar.getCookieString(`${config.domain}/account/login`); // "key1=value1; key2=value2; ..."
                //var cookies = cookieJar.getCookies(`${config.domain}/account/login`);
                //debuger(`/account/testItem body:${util.inspect(resObj)}`);
                assert.equal(httpResponse.statusCode, 200);
                assert.equal(resObj.data.female_result , 0.98);
                assert.equal(resObj.data.typeName , 'HCG');
                return done();
            });

        });

        it('Should add female TestItem  FSH failed without female_result', function (done) {

            var formData = {
                account: testAccount,
                createDate: 351738700000,
                cid_test_item: "65432190",
                typeName: 'FSH'
            };

            var options = {
                url: `${config.domain}/account/testItem`,
                method: 'PUT',
                formData
            };

            var request = baseRequest.defaults();

            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //var cookie_string = cookieJar.getCookieString(`${config.domain}/account/login`); // "key1=value1; key2=value2; ..."
                //var cookies = cookieJar.getCookies(`${config.domain}/account/login`);
                //debuger(`/account/testItem body:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 400);
                assert.equal(resObj.code , 400003);
                assert.equal(resObj.name , 'female_result_required');
                return done();
            });

        });


        it('Should get testItem by cid fail -> param error  ', function (done) {
            var form  = {
                //cid_test_item: "123456"
            };

            var options = {
                url: `${config.domain}/account/testItem`,
                method: 'GET',
                form: form
            };

            var request = baseRequest.defaults();

            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`/account/testItem body:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 400);
                assert.equal(resObj.code ,400002);
                assert.equal(resObj.name ,"cid_test_item_required");
                return done();
            });

        });

        it('Should get testItem by cid fail -> no data with the cid', function (done) {

            var propertiesObject = {cid_test_item:"123456-2"};
            var options = {
                url: `${config.domain}/account/testItem`,
                method: 'GET',
                qs: propertiesObject
            };

            var request = baseRequest.defaults();

            request(options, function(err, httpResponse, body){
                if(err){
                    return done(err);
                }
                const resObj = utils.jsonParse(body);
                //debuger(`/account/testItem body:${util.inspect(resObj)}`);

                assert.equal(httpResponse.statusCode, 404);
                assert.equal(resObj.code ,404001);
                assert.equal(resObj.name ,"not_found");
                return done();
            });

        });

        it('Should get testItem by cid fail -> session account != data account ', async function () {

            let getTestItemBy_cid_test_item_fail = function(cid_test_item) {

                let ps = new Promise(async function(resolve, reject) {

                    var propertiesObject = {cid_test_item:cid_test_item};

                    var options = {
                        url: `${config.domain}/account/testItem`,
                        method: 'GET',
                        qs: propertiesObject
                    };

                    var request = baseRequest.defaults();

                    request(options, function(err, httpResponse, body){
                        if(err){
                            return reject(err);
                        }
                        const resObj = utils.jsonParse(body);
                        //debuger(`/account/testItem body:${util.inspect(resObj)}`);

                        assert.equal(httpResponse.statusCode, 401);
                        assert.equal(resObj.code ,401001);
                        assert.equal(resObj.name ,"not_authorized");
                        return resolve();
                    });


                });
                return ps;
            }

            await reisterUser('123@gmail.com');
            await enableRegisterUser('123@gmail.com')
            await loginUser('123@gmail.com')
            await getTestItemBy_cid_test_item_fail('123456');

        });

        it('Should get testItem by cid successfully ', async function () {

            let getTestItemBy_cid_test_item_success = function(cid_test_item) {

                let ps = new Promise(async function(resolve, reject) {

                    var propertiesObject = {cid_test_item:cid_test_item};

                    var options = {
                        url: `${config.domain}/account/testItem`,
                        method: 'GET',
                        qs: propertiesObject
                    };

                    var request = baseRequest.defaults();

                    request(options, function(err, httpResponse, body){
                        if(err){
                            return reject(err);
                        }
                        const resObj = utils.jsonParse(body);
                        //debuger(`/account/testItem body:${util.inspect(resObj)}`);
                        assert.equal(httpResponse.statusCode, 200);
                        assert.equal( resObj.data.motility , 0.1);
                        assert.equal((typeof resObj.data.cid_test_item  === 'string'), true);
                        assert.equal((typeof resObj.data.sid_test_item  === 'string'), true);
                        return resolve();
                    });


                });
                return ps;
            }

            await loginUser('erhu65@gmail.com');
            await getTestItemBy_cid_test_item_success('123456');

        });


        it('Should get testItem images failes -> femail FSH', async function () {

            let getTestItemImageFailed = function(cid_test_item) {

                let ps = new Promise(async function(resolve, reject) {

                    var propertiesObject = {cid_test_item:cid_test_item};

                    var options = {
                        url: `${config.domain}/account//testItem/images`,
                        method: 'GET',
                        qs: propertiesObject
                    };

                    var request = baseRequest.defaults();

                    request(options, function(err, httpResponse, body){
                        if(err){
                            return reject(err);
                        }
                        const resObj = utils.jsonParse(body);
                        //debuger(`/account/testItem body:${util.inspect(resObj)}`);
                        assert.equal(httpResponse.statusCode, 404);
                        assert.equal(resObj.code, 404001);
                        assert.equal(resObj.name, 'not_found');
                        return resolve();
                    });


                });
                return ps;
            }

            await loginUser('erhu65@gmail.com')
            await getTestItemImageFailed('65432191');

        });

        it('Should get testItem images successfully -> femail HCG', async function () {

            let getTestItemImageSuccess = function(cid_test_item) {

                let ps = new Promise(async function(resolve, reject) {

                    var propertiesObject = {cid_test_item:cid_test_item};

                    var options = {
                        url: `${config.domain}/account/testItem/images`,
                        method: 'GET',
                        qs: propertiesObject,
                        gzip: true
                    };

                    var request = baseRequest.defaults();
                    let tmpFilePath = __dirname + `/tmp/tmp-${Date.now()}.zip`;
                    request(options, function(err, httpResponse, body){
                        if(err){
                            return reject(err);
                        }
                        // body is the decompressed response body
                        //console.log('server encoded the data as: ' + (httpResponse.headers['content-encoding'] || 'identity'))
                        //console.log('the decoded data is: ' + body)

                        //debuger(`/account/testItem body:${util.inspect(body)}`);
                        assert.equal(httpResponse.statusCode, 200);

                    }).on('data', function(data) {
                        // decompressed data as it is received
                        //console.log('decoded chunk: ' + data)
                        fs.appendFileSync(tmpFilePath, data)
                    }).on('response', function(response) {
                        // unmodified http.IncomingMessage object
                        response.on('data', function(data) {

                            // compressed data as it is received
                            //console.log('received ' + data.length + ' bytes of compressed data')

                        });
                        response.on('end', function() {

                            let zip = new AdmZip(tmpFilePath);
                            let unzipContent = zip.readAsText("test2.txt")
                            let base64str_join_by_1_image = fs.readFileSync(__dirname + `/tmp/test2.txt`).toString();
                            assert.equal(base64str_join_by_1_image ===  unzipContent, true);
                            fs.unlinkSync(tmpFilePath);

                            return resolve();

                        });

                    });

                });
                return ps;
            }
            await loginUser('erhu65@gmail.com')
            await getTestItemImageSuccess('65432194');

        });

        it('Should get testItem base64 join txt, and you can parse it as 60 ', async function () {

            let getTestItemImageSuccess = function(cid_test_item) {

                let ps = new Promise(async function(resolve, reject) {

                    var propertiesObject = {cid_test_item:cid_test_item};

                    var options = {
                        url: `${config.domain}/account/testItem/images`,
                        method: 'GET',
                        qs: propertiesObject
                    };

                    var request = baseRequest.defaults();
                    let tmpFilePath = __dirname + `/tmp/tmp-${Date.now()}.zip`;
                    request(options, function(err, httpResponse, body){
                        if(err){
                            return reject(err);
                        }
                        //debuger(`content-type:${util.inspect(httpResponse.headers['content-type'])}`);
                        //debuger(`content-length:${util.inspect(httpResponse.headers['content-length'])}`);
                        assert.equal(httpResponse.statusCode, 200);

                    }).on('data', function(data) {
                        // decompressed data as it is received
                        //console.log('decoded chunk: ' + data)
                        fs.appendFileSync(tmpFilePath, data)
                    }).on('response', function(response) {
                        // unmodified http.IncomingMessage object
                        response.on('data', function(data) {

                            // compressed data as it is received
                            //console.log('received ' + data.length + ' bytes of compressed data')

                        });
                        response.on('end', function() {

                            let zip = new AdmZip(tmpFilePath);
                            let unzipContent = zip.readAsText("test1.txt")
                            let base64str_join_by_60_images = fs.readFileSync(__dirname + `/tmp/test1.txt`).toString();
                            assert.equal(base64str_join_by_60_images ===  unzipContent, true);
                            var images_base64_str_arr = unzipContent.split('-bonraybio-');
                            assert.equal(images_base64_str_arr.length, 60);

                            var i = 1;
                            for (const image_base64_str of images_base64_str_arr) {
                                let numStr = utils.pad(i, 3);
                                let saveedPath = __dirname + `/base64_images_decode/image_decode_${numStr}.jpg`;
                                utils.base64_decode(image_base64_str, saveedPath);
                                i++;
                            }
                            fs.unlinkSync(tmpFilePath);
                            return resolve();
                        });

                    });

                });
                return ps;
            }

            await getTestItemImageSuccess('123456');

        });


        it('Should get all testitems by account with login session ', async function () {

            let getTestItemImageSuccess = function() {

                let ps = new Promise(async function(resolve, reject) {


                    var options = {
                        url: `${config.domain}/account/testItems`,
                        method: 'GET'
                    };

                    var request = baseRequest.defaults();

                    request(options, function(err, httpResponse, body){
                        if(err){
                            return reject(err);
                        }
                        const resObj = utils.jsonParse(body);
                        //debuger(`/account/testItem body:${util.inspect(body)}`);
                        assert.equal(httpResponse.statusCode, 200);
                        assert.equal(resObj.data.length, 3);
                        return resolve();
                    });

                });
                return ps;
            }

            await getTestItemImageSuccess();

        });

    });


});


describe('access resource after login', function () {

    before(async function() {
        // runs before all tests in this block

        await reisterUser('124@gmail.com');
        await enableRegisterUser('124@gmail.com');

        await reisterUser('125@gmail.com');
        await enableRegisterUser('125@gmail.com')

        await loginUser('124@gmail.com');

    });

    after(async function() {
        // runs after all tests in this block
    });

    it('Should change account password fail -> password params not valids', async function () {

        let changePasswordFail = function(formData, expectObj) {

            let ps = new Promise(async function(resolve, reject) {

                var options = {
                    url: `${config.domain}/account/update`,
                    method: 'POST'
                };
                if(formData) {
                    options.form = formData;
                }

                var request = baseRequest.defaults();

                request(options, function(err, httpResponse, body){
                    if(err){
                        return reject(err);
                    }
                    const resObj = utils.jsonParse(body);
                    //debuger(`/account/testItem body:${util.inspect(body)}`);
                    expect(httpResponse.statusCode).to.equal(expectObj.httpStatus);
                    expect(resObj.code).to.equal(expectObj.errorCode);
                    expect(resObj.name).to.equal(expectObj.errorName);
                    return resolve(resObj);
                });
            });
            return ps;
        }

        var failTests = [
            {formData: {newPassword: '1234'},
                expect:{
                    httpStatus: 400,
                    errorCode: 400002,
                    errorName: 'newPasswordConfirm_required',
                }},
            {formData: {newPasswordConfirm: '1234'},
                expect:{
                    httpStatus: 400,
                    errorCode: 400002,
                    errorName: 'newPassword_required',
                }},
            {formData: {newPassword: '1234',
                        newPasswordConfirm: '12345'},
                expect:{
                    httpStatus: 400,
                    errorCode: 400002,
                    errorName: 'newPassword_newPasswordConfirm_not_match',
                }}
        ];

        for (let test of failTests) {
            await changePasswordFail(test.formData, test.expect);
        }


    });

    it('Should update account password  detail, apns successfully ', async function () {
        await changePasswordSuccess('12345');
        await　loginUserWithPwd('124@gmail.com', '12345');
    });

    it('Should get account detail, profile, apns success ', async function () {

        let getAccountDetailApnsProfileSuccess = function() {

            let ps = new Promise(async function(resolve, reject) {

                var options = {
                    url: `${config.domain}/account`,
                    method: 'GET'
                };
                var request = baseRequest.defaults();

                request(options, function(err, httpResponse, body){
                    if(err){
                        return reject(err);
                    }
                    const resObj = utils.jsonParse(body);
                    //debuger(`/account/testItem body:${util.inspect(body)}`);
                    expect(httpResponse.statusCode).to.equal(200);
                    expect(resObj.data).to.have.all.keys('account', 'apnsTokens', 'firstName', 'gender', 'height', 'lastName', 'weight', 'who_standard', 'spouse','profile', 'fullName', 'is_allow_mutiple_device_login');
                    expect(resObj.data.apnsTokens).to.be.a('array');
                    expect(resObj.data.apnsTokens).to.include("XXXXXXX");
                    expect(resObj.data.apnsTokens).to.include("apnstoken2");
                    //expect(resObj.data.profile).to.equal("medication");
                    expect(resObj.data.height).to.equal(22);
                    expect(resObj.data.fullName).to.equal('Peter Huang');
                    return resolve(resObj);
                });
            });
            return ps;
        }
        await getAccountDetailApnsProfileSuccess();

    });

    var aftre_3th_record_save_time;
    var aftre_2th_record_save_time_spouse;
    it('Should add 5 new testItem for me and 5 testItem for spouse ',  async function () {

        let addNewTestItem = function(data){

            let ps = new Promise(function(resolve, reject) {
                var formData = {
                    account: data.account,
                    createDate: data.createDate,
                    cid_test_item: data.cid_test_item,
                    typeName: data.typeName,
                    serial_images_base64_str_join_binary: data.serial_images_base64_str_join_binary,
                    motility:data.motility,
                    morphology:data.morphology,
                    concentraction:data.concentraction
                };

                var options = {
                    url: `${config.domain}/account/testItem`,
                    method: 'PUT',
                    formData
                };

                var request = baseRequest.defaults();

                request(options, function(err, httpResponse, body){
                    if(err){
                        return reject(err);
                    }
                    const resObj = utils.jsonParse(body);


                    //debuger(`/account/testItem body:${util.inspect(resObj)}`);

                    assert.equal(httpResponse.statusCode, 200);
                    assert.equal(resObj.data.typeName, data.typeName);
                    assert.equal(resObj.data.concentraction, data.concentraction);
                    assert.equal(resObj.data.morphology, data.morphology);
                    assert.equal(resObj.data.motility, data.motility);
                    assert.equal(resObj.data.url, undefined);
                    assert.equal((typeof resObj.data.sid_test_item  === 'string'), true, 'sid_test_item should have value as string');
                    assert.equal(resObj.data.cid_test_item , data.cid_test_item);
                    expect(resObj.data.server_create_time).to.be.a('number');
                    return resolve(resObj);

                });

            });
            return ps;
        }

        let addNewTestItemSpouse = function(data){

            let ps = new Promise(function(resolve, reject) {
                var formData = {
                    account: data.account,
                    createDate: data.createDate,
                    cid_test_item: data.cid_test_item,
                    typeName: data.typeName,
                    female_result:data.female_result
                };
                if(data.serial_images_base64_str_join_binary){
                    formData.serial_images_base64_str_join_binary = data.serial_images_base64_str_join_binary;
                }

                var options = {
                    url: `${config.domain}/account/testItem`,
                    method: 'PUT',
                    formData
                };

                var request = baseRequest.defaults();

                request(options, function(err, httpResponse, body){
                    if(err){
                        return reject(err);
                    }
                    const resObj = utils.jsonParse(body);


                    //debuger(`addNewTestItemSpouse:${util.inspect(resObj)}`);

                    assert.equal(httpResponse.statusCode, 200);
                    assert.equal(resObj.data.typeName, data.typeName);
                    assert.equal(resObj.data.female_result, data.female_result);
                    assert.equal(resObj.data.url, undefined);
                    assert.equal((typeof resObj.data.sid_test_item  === 'string'), true, 'sid_test_item should have value as string');
                    assert.equal(resObj.data.cid_test_item , data.cid_test_item);
                    expect(resObj.data.server_create_time).to.be.a('number');
                    return resolve(resObj);

                });

            });
            return ps;
        }

        var addNewTestItemTests = [
            {formData: {
                account: '124@gmail.com',
                createDate: 324738700002,
                cid_test_item: "1234567-2",
                typeName: 'sperm',
                serial_images_base64_str_join_binary: fs.createReadStream(__dirname + `/tmp/test1.zip`),
                motility:0.4,
                morphology:0.5,
                concentraction:0.6
            }},
            {formData: {
                account: '124@gmail.com',
                createDate: 324738700001,
                cid_test_item: "1234567-1",
                typeName: 'sperm',
                serial_images_base64_str_join_binary: fs.createReadStream(__dirname + `/tmp/test1.zip`),
                motility:0.1,
                morphology:0.2,
                concentraction:0.3
            }},
            {formData: {
                account: '124@gmail.com',
                createDate: 324738700003,
                cid_test_item: "1234567-3",
                typeName: 'sperm',
                serial_images_base64_str_join_binary: fs.createReadStream(__dirname + `/tmp/test1.zip`),
                motility:0.1,
                morphology:0.6,
                concentraction:0.1
            }},
            {formData: {
                account: '124@gmail.com',
                createDate: 324738700006,
                cid_test_item: "1234567-4",
                typeName: 'sperm',
                serial_images_base64_str_join_binary: fs.createReadStream(__dirname + `/tmp/test1.zip`),
                motility:0.9,
                morphology:0.3,
                concentraction:0.3
            }},
            {formData: {
                account: '124@gmail.com',
                createDate: 32473870007,
                cid_test_item: "1234567-5",
                typeName: 'sperm',
                serial_images_base64_str_join_binary: fs.createReadStream(__dirname + `/tmp/test1.zip`),
                motility:0.9,
                morphology:0.3,
                concentraction:0.3
            }}
        ];

        var i = 1;
        for (let test of addNewTestItemTests) {
            await addNewTestItem(test.formData);
            if(i == 3) {
                aftre_3th_record_save_time = new Date();
            }
            await utils.delay(2000);
            i++;
        }

        var addNewTestItemTestsSpouse = [
            {formData: {
                account: '125@gmail.com',
                createDate: 324738700002,
                cid_test_item: "1234568-2",
                typeName: 'HCG',
                serial_images_base64_str_join_binary: fs.createReadStream(__dirname + `/tmp/test2.zip`),
                female_result:0.4
            }},
            {formData: {
                account: '125@gmail.com',
                createDate: 324738700001,
                cid_test_item: "1234568-1",
                typeName: 'HCG',
                serial_images_base64_str_join_binary: fs.createReadStream(__dirname + `/tmp/test2.zip`),
                female_result:0.4
            }},
            {formData: {
                account: '125@gmail.com',
                createDate: 324738700003,
                cid_test_item: "1234568-3",
                typeName: 'HCG',
                serial_images_base64_str_join_binary: fs.createReadStream(__dirname + `/tmp/test2.zip`),
                female_result:0.4
            }},
            {formData: {
                account: '125@gmail.com',
                createDate: 324738700006,
                cid_test_item: "1234568-4",
                typeName: 'LH',
                female_result:0.4
            }},
            {formData: {
                account: '125@gmail.com',
                createDate: 32473870007,
                cid_test_item: "1234568-5",
                typeName: 'FSH',
                female_result:0.4
            }}
        ];

        var j = 1;
        for (let test of addNewTestItemTestsSpouse) {
            await addNewTestItemSpouse(test.formData);
            if(j == 2) {
                aftre_2th_record_save_time_spouse = new Date();
            }
            await utils.delay(1000);
            j++;
        }
    });

    it('sync testItems failed -> no server_create_time',  async function () {

        let getTestItemImageBy_server_create_time_failed = function(server_create_time) {

            let ps = new Promise(async function(resolve, reject) {

                var propertiesObject = {server_create_time:server_create_time};
                var options = {
                    url: `${config.domain}/account/sync/testItem/me`,
                    method: 'GET'
                };

                var request = baseRequest.defaults();

                request(options, function(err, httpResponse, body){
                    if(err){
                        return reject(err);
                    }
                    const resObj = utils.jsonParse(body);
                    //debuger(`/account/testItem body:${util.inspect(body)}`);
                    expect(httpResponse.statusCode).to.equal(400);
                    expect(resObj.code).to.equal(400002);
                    expect(resObj.name).to.equal('server_create_time_required');
                    return resolve();
                });

            });
            return ps;
        }

        await getTestItemImageBy_server_create_time_failed();

    });

    it('sync testItem by server_create_time successfully',  async function () {

        let getTestItemImageBy_server_create_time_Success = function(server_create_time, exepctedLenght) {

            let ps = new Promise(async function(resolve, reject) {

                var propertiesObject = {server_create_time:server_create_time};
                var options = {
                    url: `${config.domain}/account/sync/testItem/me`,
                    method: 'GET',
                    qs:propertiesObject
                };

                var request = baseRequest.defaults();

                request(options, function(err, httpResponse, body){
                    if(err){
                        return reject(err);
                    }
                    const resObj = utils.jsonParse(body);
                    //debuger(`/account/testItem body:${util.inspect(body)}`);
                    assert.equal(httpResponse.statusCode, 200);
                    assert.equal(resObj.data.length, exepctedLenght);
                    return resolve();
                });

            });
            return ps;
        }

        await getTestItemImageBy_server_create_time_Success(0, 5);
        await getTestItemImageBy_server_create_time_Success(aftre_3th_record_save_time, 2);

    });

    it('Should update spouse failed ', async function () {

        let changeSpouseFailed = function(spouse) {

            let ps = new Promise(async function(resolve, reject) {

                var options = {
                    url: `${config.domain}/account/update`,
                    method: 'POST',
                    form: {spouse: spouse}
                };
                var request = baseRequest.defaults();

                request(options, function(err, httpResponse, body){
                    if(err){
                        return reject(err);
                    }
                    const resObj = utils.jsonParse(body);
                    //debuger(`/account/testItem body:${util.inspect(body)}`);
                    expect(httpResponse.statusCode).to.equal(404);
                    expect(resObj.code).to.equal(404001);
                    expect(resObj.name).to.equal('spouse_not_found');
                    return resolve(resObj);
                });
            });
            return ps;
        }

        await changeSpouseFailed('aaa@gemail.com');
    });

    it('Should sync spouse testItem by server_create_time failed -> no spouse',  async function () {

        let getSpouseTestItemImageBy_server_create_time_Failed = function(server_create_time, exepctedLenght) {

            let ps = new Promise(async function(resolve, reject) {

                var propertiesObject = {server_create_time:server_create_time};
                var options = {
                    url: `${config.domain}/account/sync/testItem/spouse`,
                    method: 'GET',
                    qs:propertiesObject
                };

                var request = baseRequest.defaults();

                request(options, function(err, httpResponse, body){
                    if(err){
                        return reject(err);
                    }
                    const resObj = utils.jsonParse(body);
                    //debuger(`/account/testItem body:${util.inspect(body)}`);
                    expect(httpResponse.statusCode).to.equal(404);
                    expect(resObj.code).to.equal(404001);
                    expect(resObj.name).to.equal('spouse_not_found');
                    return resolve();
                });

            });
            return ps;
        }

        await getSpouseTestItemImageBy_server_create_time_Failed(0, 5);

    });


    it('Should update spouse successfully ', async function () {

        let changeSpousesuccessfully= function(spouse) {

            let ps = new Promise(async function(resolve, reject) {

                var options = {
                    url: `${config.domain}/account/update`,
                    method: 'POST',
                    form: {spouse: spouse}
                };
                var request = baseRequest.defaults();

                request(options, function(err, httpResponse, body){
                    if(err){
                        return reject(err);
                    }
                    const resObj = utils.jsonParse(body);
                    //debuger(`/account/testItem body:${util.inspect(body)}`);
                    expect(httpResponse.statusCode).to.equal(200);
                    expect(resObj.data.spouse).to.equal(spouse);
                    return resolve(resObj);
                });
            });
            return ps;
        }

        await changeSpousesuccessfully('125@gmail.com');
    });

    it('Should sync spouse testItem by server_create_time successfully',  async function () {

        let getSpouseTestItemImageBy_server_create_time_Success = function(server_create_time, exepctedLenght) {

            let ps = new Promise(async function(resolve, reject) {

                var propertiesObject = {server_create_time:server_create_time};
                var options = {
                    url: `${config.domain}/account/sync/testItem/spouse`,
                    method: 'GET',
                    qs:propertiesObject
                };

                var request = baseRequest.defaults();

                request(options, function(err, httpResponse, body){
                    if(err){
                        return reject(err);
                    }
                    const resObj = utils.jsonParse(body);
                    //debuger(`/account/testItem body:${util.inspect(body)}`);
                    assert.equal(httpResponse.statusCode, 200);
                    assert.equal(resObj.data.length, exepctedLenght);
                    expect(resObj.data[0].account).to.equal('125@gmail.com');
                    expect(resObj.data[0].server_create_time).to.be.a('number');

                    return resolve();
                });

            });
            return ps;
        }

        await getSpouseTestItemImageBy_server_create_time_Success(0, 5);
        await getSpouseTestItemImageBy_server_create_time_Success(aftre_2th_record_save_time_spouse, 3);

    });

});