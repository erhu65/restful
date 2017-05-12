const assert = require('assert');
var should = require('should');
const expect = require('chai').expect;
var async = require('async');
var mongoosePrepare = require('../../model/mongoosePrepare');
var utils = require('../../helpers/utils');
var debug1 = require('debug')('bonraybio:test_accountDetail');
let util = require('util');

//mongoose.Promise = global.Promise;


var bonrayboi = require('../../model/bonraybio');

var AccountModel;
var AccountDetailModel;
var AccountTokenModel;
var AccountProfileModel;
var TestItemModel;
var AdditionalFileModel;

var config = require('../../config.json');
var connectUrl = `mongodb://${config.mongodb.server}:27017/bonraybio-test`;
var mongoose;

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


let addAndEnableNewAccount = function (newData) {

    let ps = new Promise(function (resolve, reject) {

        var accountCreateData = {
            "account": newData.account,
            "firstName": newData.firstName,
            "lastName": newData.lastName,
            "password": newData.password,
            "gender": newData.gender,
            "birthday": newData.birthday,
            "height": newData.height,
            "weight": newData.weight,
            "who_standard": newData.who_standard,
            "apnsToken": newData.apnsToken
        };


        AccountDetailModel.createOneWithData(accountCreateData, function (err, accountDetailModel) {
            if (err) {
                return reject(err);
            }
            assert.notEqual(accountDetailModel, null);
            accountDetailModel.enable(function (err, accountDetailModel) {
                if (err) {
                    return reject(err);
                }

                resolve(accountDetailModel);
            });

        });

    });
    return ps;
}



let addNewTestItem = function (newData) {

    let ps = new Promise(async function (resolve, reject) {

        var testItemData = {
            account: newData.account,
            createDate: newData.createDate,
            cid_test_item: newData.cid_test_item,
            typeName: newData.typeName,
            motility: newData.motility,
            morphology: newData.morphology,
            concentraction: newData.concentraction,
            sid_profile: newData.sid_profile
        };


        let accountDetailModel = await AccountDetailModel.getOneByAccount(testItemData.account);
        let sid_profile = accountDetailModel.sid_profile;

        let testItemModel = await TestItemModel.createOneWithData(testItemData);
        testItemData.sid_profile = sid_profile;

        let testItemModelJson = await testItemModel.getJsonData();
        assert.equal(testItemModelJson.motility, newData.motility);
        assert.equal(testItemModelJson.account, newData.account);
        assert.equal(testItemModelJson.url, undefined);
        resolve(testItemData);

    });
    return ps;
}



before(function(done) {
    console.log('before');

    mongoosePrepare.init(connectUrl, options, function (err, mongooseConnected) {

        if(err) throw  Error(err);
        mongoose = mongooseConnected;
        bonrayboi.initWithConnection(mongooseConnected);
        AccountDetailModel = bonrayboi.AccountDetailModel;
        AccountTokenModel = bonrayboi.AccountTokenModel;
        AccountProfileModel =  bonrayboi.AccountProfileModel;
        TestItemModel = bonrayboi.TestItemModel;
        AdditionalFileModel = bonrayboi.AdditionalFileModel;
        AccountModel = bonrayboi.AccountModel;
        
        if (mongooseConnected.connection.readyState === 0) {

            mongooseConnected.createConnection(connectUrl, options, function (err) {
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
            return done();
        }
    });

});

after(function(done) {
    console.log('after');
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

describe('AccountDetail/TestItem', function () {

    describe('AccountDetail: models', function () {

        describe('#create()', function () {

            describe('validate columns', function () {

                it('Should detect validation errors ', function (done) {

                    var accountCreateData = {
                        "account":"erhu65gmail.com",
                        "firstName":"John",
                        "lastName":"Douglas",
                        "password":"12346",
                        "gender":'a',
                        //"profile":"LH98",
                        "birthday": new Date(),
                        "height": 158,
                        "weight": 58,
                        "who_standard": '6'
                    };

                    var validReport = AccountDetailModel.validationReport(accountCreateData);

                    if(validReport){
                        return done();
                    }

                    return done('not detect validation errors');

                });

                it('Should not detect validation errors ', function (done) {

                    var accountCreateData = {
                        "account":"erhu65@gmail.com",
                        "firstName":"John",
                        "lastName":"Douglas",
                        "password":"12345",
                        "gender":1,
                        //"profile":"contraception",
                        "birthday": new Date(),
                        "height": 158,
                        "weight": 58,
                        "who_standard": '5'
                    };
                    var validReport = AccountDetailModel.validationReport(accountCreateData);

                    if(validReport){
                        return done(validReport);
                    }
                    return done();
                });

            });

            it('Should check account not exist in auth collection', async function () {

                let account = await AccountModel.getBy_account('erhu65@gmail.com');
                assert.equal(account, null);
            });

            it('Should check account not exist', function (done) {

                AccountDetailModel.findOne({account: 'erhu65@gmail.com'}, function (err, accountDetailModel) {
                    if (err) {
                        return done(err);
                    }
                    assert.equal(accountDetailModel, null);
                    done();

                });
            });

            it('Should create a new AccountDetail with apnsToken ', function (done) {

                var accountCreateData = {
                    "account":"erhu65@gmail.com",
                    "firstName":"John",
                    "lastName":"Douglas",
                    "password":"123456",
                    "gender":1,
                    //"profile":"contraception",
                    "birthday": new Date(),
                    "height": 158,
                    "weight": 58,
                    "who_standard": '5',
                    "apnsToken":"wirperiwpr932222"
                };


                AccountDetailModel.createOneWithData(accountCreateData, function (err, accountDetailModel) {
                    if (err) {
                        return done(err);
                    }
                    assert.notEqual(accountDetailModel, null);
                    done();
                });
            });


            it('Should find AccountDetail by account=erhu65@gmail.com', function (done) {

                AccountDetailModel.findOne({account: 'erhu65@gmail.com'}, function (err, accountDetailModel) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(accountDetailModel.account, "erhu65@gmail.com");
                    assert.equal(accountDetailModel.firstName, "John");
                    assert.equal(accountDetailModel.lastName, "Douglas");
                    assert.equal(accountDetailModel.fullName, "John Douglas");
                    assert.equal(accountDetailModel.password, "123456");
                    assert.equal(accountDetailModel.gender, 1);
                    assert.equal(accountDetailModel.is_active, false);
                    //assert.equal(accountDetailModel.profile, "LH");
                    assert.equal(accountDetailModel.spouse, undefined);
                    done();
                });

            });


            it('Should update account=erhu65@gmail.com  is_active=false', function (done) {

                var dateOld;
                var dateNew;
                async.waterfall([
                    function(callback) {

                        var dataToUpdate = {is_active: true};

                        AccountDetailModel.findByAccountAndUpdate('erhu65@gmail.com', dataToUpdate, function (err, accountDetailModel) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, accountDetailModel);

                        });
                    },
                    function(accountDetailModel, callback) {
                        dateOld = accountDetailModel.server_update_time;

                        assert.equal(accountDetailModel.is_active, true);

                        setTimeout(function () {
                            var dataToUpdate = {is_active: false};
                            AccountDetailModel.findByAccountAndUpdate('erhu65@gmail.com', dataToUpdate, function (err, accountDetailModel) {
                                if (err) {
                                    return callback(err);
                                }

                                callback(null, accountDetailModel);
                            });

                        }, 1000);
                    }
                ], function (err, accountDetailModel) {
                    if (err) {
                        return done(err);
                    }
                    dateNew = accountDetailModel.server_update_time;
                    var diffSecs = utils.timeDiff(dateOld, dateNew ,'sec');
                    assert.equal(diffSecs, 1);
                    assert.equal(accountDetailModel.is_active , false);
                    done();
                });
            });


            it('Should enable account', function (done) {
                async.waterfall([
                    function(callback) {
                        AccountDetailModel.findOne({account: 'erhu65@gmail.com'}, function (err, accountDetailModel) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, accountDetailModel);

                        });
                    },
                    function(accountDetailModel, callback) {

                        accountDetailModel.enable(function (err, accountDetailModel) {
                            if (err) {
                                return callback(err);
                            }

                            callback(null, accountDetailModel);
                        });

                    }
                ], function (err, accountDetailModel) {
                    if (err) {
                        return done(err);
                    }
                    assert.equal(accountDetailModel.password, null);
                    assert.equal(accountDetailModel.is_active, true);
                    done();
                });
            });

            it('Should check account exist and enable', function (done) {

                AccountDetailModel.findOne({account: 'erhu65@gmail.com'}, function (err, accountDetailModel) {
                    if (err) {
                        return callback(err);
                    }
                    assert.notEqual(accountDetailModel, null);
                    assert.equal(accountDetailModel.is_active, true);
                    done();

                });

            });


        });

        describe('AccountToken: models', function () {


            it('Should validate accountToken account error', function (done) {

                var tokenData =  {
                    account:'erhu65gmail.com',
                    token:'aaasfsdf'
                };

                var validErrReport = AccountTokenModel.validationReport(tokenData);
                assert.equal(validErrReport, "erhu65gmail.com is not a valid email");
                done();
            });

            it('Should validate accountToken token error', function (done) {

                var tokenData =  {
                    account:'erhu65@gmail.com'
                };

                var validErrReport = AccountTokenModel.validationReport(tokenData);

                assert.equal(validErrReport, "APNS token required");
                done();
            });

            it('Should add an AccountToken by account ', function (done) {

                async.waterfall([
                    function(callback) {
                        AccountDetailModel.findOne({account: 'erhu65@gmail.com'}, function (err, accountDetailModel) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, accountDetailModel);

                        });
                    },
                    function(accountDetailModel, callback) {

                        accountDetailModel.addApnsToken('abcdefg', function (err, accountTokenModel) {
                            if(err){
                                return done(err);
                            }
                            callback(null, accountTokenModel);
                        });

                    }
                ], function (err, accountTokenModel) {
                    if (err) {
                        return done(err);
                    }
                    assert.equal(accountTokenModel.account, 'erhu65@gmail.com');
                    assert.equal(accountTokenModel.token, 'abcdefg');
                    done();
                });


            });

            it('Should get  AccountTokens by account ', function (done) {

                async.waterfall([
                    function(callback) {
                        AccountDetailModel.findOne({account: 'erhu65@gmail.com'}, function (err, accountDetailModel) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, accountDetailModel);

                        });
                    },
                    function(accountDetailModel, callback) {
                        accountDetailModel.apnsTokens(function (err, accountTokenModels) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, accountTokenModels);
                        });

                    }
                ], function (err, accountTokenModels) {
                    if (err) {
                        return done(err);
                    }

                    if(accountTokenModels.length > 0){

                        for (var i=0; i<accountTokenModels.length; i++) {
                            var accountTokenModel = accountTokenModels[i];
                            assert.equal(accountTokenModel.account, 'erhu65@gmail.com');

                            //console.log(`accountTokenModel.account:${accountTokenModel.account}`);
                            //console.log(`accountTokenModel.token:${accountTokenModel.token}`);
                        }
                        done();
                    }

                });

            });


            it.skip('Should remove  account and his tokens ', function (done) {

                var dataeToRemove = {account: 'erhu65@gmail.com'};
                AccountDetailModel.removeIfNeed(dataeToRemove, function (err) {
                    if (err) {
                        return done(err);
                    }

                    AccountDetailModel.findOne({account: 'erhu65@gmail.com'}, function (err, accountDetailModel) {
                        if (err) {
                            return done(err);
                        }
                        assert.equal(accountDetailModel, null);

                        done();
                    });
                });
            });



            // async.waterfall([
            //     function(callback) {
            //
            //     },
            //     function(accountDetailModel, callback) {
            //
            //
            //     }
            // ], function (err, accountDetailModel) {
            //     if (err) {
            //         return done(err);
            //     }
            //     done();
            // });

        });


        describe('AccountProfileModel', function () {

            it('Should not pass  account validate', function (done) {

                var addProfileData = {
                    account: 'erhu65gmail.com',
                    name:'adfsf'
                }

                var validateErrReport = AccountProfileModel.validationReport(addProfileData)
                should.notEqual(validateErrReport, undefined);
                done();

            });

            it('Should pass  account profile validation and add one by account', function (done) {

                async.waterfall([
                    function(callback) {
                        AccountDetailModel.findOne({account: 'erhu65@gmail.com'}, function (err, accountDetailModel) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, accountDetailModel);

                        });
                    },
                    function(accountDetailModel, callback) {

                        var data = {name:'contraception'};

                        accountDetailModel.updateProfile(data, function (err, accountProfileModel) {
                            if (err) {
                                return callback(err);
                            }
                            //callback(null, accountDetailModel, accountProfileModel);
                        });

                        setTimeout(function () {
                            var data = {name:'medication'};
                            accountDetailModel.updateProfile(data, function (err, accountProfileModel) {
                                if (err) {
                                    return callback(err);
                                }
                                callback(null, accountDetailModel, accountProfileModel);
                            });
                        }, 500);
                    }
                ], function (err, accountDetailModel, accountProfileModel) {
                    if (err) {
                        return done(err);
                    }

                    accountDetailModel.getProfiles(function (err, accountProfilesModels) {

                        if(accountProfilesModels.length > 0){
                            for (var i=0; i<accountProfilesModels.length; i++) {
                                var accountProfilesModel = accountProfilesModels[i];
                                assert.equal(accountProfilesModel.account, 'erhu65@gmail.com');
                                //assert.equal(accountProfileModel.name, 'contraception');
                            }
                            done();
                        }
                    });

                });

            });

            it('Should get account by email sync', async function () {
                let accountDetailModel = await AccountDetailModel.getOneByAccount("erhu65@gmail.com");
                //debug1(`Should get account by email sync accountDetailModel.sid_profile): ${util.inspect(accountDetailModel.sid_profile)}`);
                should.equal(accountDetailModel.account, "erhu65@gmail.com");
                should.notEqual(accountDetailModel.sid_profile, undefined);

            });

        });


    });

    describe('TestItem', function () {

        it('Should detect validation errors ', async function () {

            var testItemData = {
                //account: "erhu66@gmail.com",
                createDate: Date(),
                cid_test_item: "123456",
                typeName: 'sperm'
            };
            let errs =  await TestItemModel.validationErrs(testItemData);
            //debug1(`Should detect validation errors: ${util.inspect(errs)}`);
            let errCount = errs.length;
            assert.equal(true, (errCount > 0));


            testItemData = {
                //account: "erhu66@gmail.com",
                createDate: Date(),
                cid_test_item: "123456",
                typeName: 'sperm',
                motility: 0.6,
                morphology: 0.7,
                concentraction: 0.8
            };
            let errs2 =  await TestItemModel.validationErrs(testItemData);
            let errStr = errs2[0];
            assert.equal(errStr, 'Account required');

            testItemData = {
                account: "erhu6gmail.com",
                createDate: Date(),
                cid_test_item: "123456",
                typeName: 'sperm',
                motility: 0.6,
                morphology: 0.7,
                concentraction: 0.8
            };
            errs2 =  await TestItemModel.validationErrs(testItemData);
            errStr = errs2[0];
            assert.equal(errStr, 'erhu6gmail.com is not a valid email');

            testItemData = {
                account: "erhu66@gmail.com",
                //createDate: Date(),
                cid_test_item: "123456",
                typeName: 'Sperm',
                motility: 0.6,
                morphology: 0.7,
                concentraction: 0.8
            };
            errs2 =  await TestItemModel.validationErrs(testItemData);
            errStr = errs2[0];
            assert.equal(errStr, 'createDate required');

            testItemData = {
                account: "erhu66@gmail.com",
                createDate: Date(),
                //cid: "123456",
                typeName: 'sperm',
                motility: 0.6,
                morphology: 0.7,
                concentraction: 0.8
            };
            errs2 =  await TestItemModel.validationErrs(testItemData);
            errStr = errs2[0];
            assert.equal(errStr, 'cid_test_item required');

            testItemData = {
                account: "erhu66@gmail.com",
                createDate: Date(),
                cid_test_item: "123456",
                //typeName: 'Sperm',
                motility: 0.6,
                morphology: 0.7,
                concentraction: 0.8
            };
            errs2 =  await TestItemModel.validationErrs(testItemData);
            errStr = errs2[0];
            assert.equal(errStr, 'typeName required');

            testItemData = {
                account: "erhu66@gmail.com",
                createDate: Date(),
                cid_test_item: "123456",
                typeName: 'XXX',
                motility: 0.6,
                morphology: 0.7,
                concentraction: 0.8
            };
            errs2 =  await TestItemModel.validationErrs(testItemData);
            errStr = errs2[0];
            assert.equal(errStr, '`XXX` is not a valid enum value for path `typeName`.');

        });


        it('Should add a male TestItem successfully ', async function () {

            var testItemData = {
                account: "erhu65@gmail.com",
                createDate: Date(),
                cid_test_item: "123456123",
                typeName: 'sperm',
                motility: 0.6,
                morphology: 0.7,
                concentraction: 0.8
            };

            let errs =  await TestItemModel.validationErrs(testItemData);
            assert.equal(errs, undefined);

            let accountDetailModel = await AccountDetailModel.getOneByAccount(testItemData.account);

            //debug1(`Should add a TestItem successfully accountDetailModel.sid_profile): ${util.inspect(accountDetailModel.sid_profile)}`);
            let sid_profile = accountDetailModel.sid_profile;
            testItemData.sid_profile = sid_profile;

            let testItemModel = await TestItemModel.createOneWithData(testItemData);
            let testItemModelJson =  await testItemModel.getJsonData();
            assert.equal(testItemModelJson.motility, 0.6);
            assert.equal(testItemModelJson.account, "erhu65@gmail.com");
            assert.equal(testItemModel.sid_profile, sid_profile);
        });

        it('Should get  TestItem  by cid_test_item failed ', async function () {

            let testItemModel =  await TestItemModel.getBy_cid_test_item("123456-2");
            assert.equal(testItemModel, null);

        });

        it('Should get  TestItem  by cid_test_item successfully ', async function () {

            let testItemModel =  await TestItemModel.getBy_cid_test_item("123456123");
            assert.equal(testItemModel instanceof  TestItemModel, true);

        });

        it('Should add a male TestItem and 2 additional_file successfully', async function () {

            var testItemData = {
                account: "erhu65@gmail.com",
                createDate: Date(),
                cid_test_item: "8976665",
                typeName: 'sperm',
                motility: 0.6,
                morphology: 0.7,
                concentraction: 0.8
            };

            let errs =  await TestItemModel.validationErrs(testItemData);
            assert.equal(errs, undefined);

            let accountDetailModel = await AccountDetailModel.getOneByAccount(testItemData.account);

            //debug1(`Should add a TestItem successfully accountDetailModel.sid_profile): ${util.inspect(accountDetailModel.sid_profile)}`);
            let sid_profile = accountDetailModel.sid_profile;
            testItemData.sid_profile = sid_profile;

            let testItemModel = await TestItemModel.createOneWithData(testItemData);
            let testItemModelJson = await testItemModel.getJsonData();
            assert.equal(testItemModelJson.motility, 0.6);
            assert.equal(testItemModelJson.account, "erhu65@gmail.com");
            assert.equal(testItemModel.sid_profile, sid_profile);
            assert.equal(testItemModelJson.url, undefined);

            let additionalFileModels_no_data = await testItemModel.getAllAdditionalFiles();

            assert.equal(additionalFileModels_no_data.length, 0);

            let additionalFileData =  {
                sid_test_item:testItemModel.sid_test_item,
                url: "http:www.google.com",
                serial:1
            };

            let additionalFile = await testItemModel.addAdditionalFile(additionalFileData);
            assert.equal(additionalFile.sid_test_item, testItemModel.sid_test_item);

            assert.notEqual(additionalFile.sid_additional_file, undefined);
            assert.notEqual(additionalFile.sid_additional_file, null);
            //debug1(`additionalFile: ${util.inspect(additionalFile.sid_additional_file)}`);

            additionalFileData.url = "http:www.yahoo.com";
            let additionalFile2 = await testItemModel.addAdditionalFile(additionalFileData);

            let additionalFileModels = await testItemModel.getAllAdditionalFiles();

            // for (const additionalFileJson of testItemModelJson2.additionalFiles) {
            //     debug1(`additionalFileJson: ${util.inspect(additionalFileJson)}`);
            // }

            for (const additionalFileModel of additionalFileModels) {
                assert.equal(additionalFileModel.sid_test_item, testItemModel.sid_test_item);
            }

        });

    });

    describe('TestItem -> Female', function () {


        it('Should add a female TestItem HUG with 1 additional_file successfully  ', async function () {

            var testItemData = {
                account: "erhu65@gmail.com",
                createDate: Date(),
                cid_test_item: "123458",
                typeName: 'HCG',
                female_result: 0.9
            };

            let errs =  await TestItemModel.validationErrs(testItemData);
            assert.equal(errs, undefined);

            let accountDetailModel = await AccountDetailModel.getOneByAccount(testItemData.account);

            //debug1(`Should add a TestItem successfully accountDetailModel.sid_profile): ${util.inspect(accountDetailModel.sid_profile)}`);
            let sid_profile = accountDetailModel.sid_profile;
            testItemData.sid_profile = sid_profile;

            let testItemModel = await TestItemModel.createOneWithData(testItemData);


            let additionalFileMo1els1 = await testItemModel.getAllAdditionalFiles();
            assert.equal(additionalFileMo1els1.length, 0);

            let additionalFileData =  {
                sid_test_item:testItemModel.sid_test_item,
                url: "http:www.google.com"
            };
            let additionalFile = await testItemModel.addAdditionalFile(additionalFileData);
            assert.equal(additionalFile.sid_test_item, testItemModel.sid_test_item);

            let additionalFileMo1els2 = await testItemModel.getAllAdditionalFiles();
            assert.equal(additionalFileMo1els2.length, 1);

            let testItemModelJson =  await testItemModel.getJsonData();
            assert.equal(testItemModelJson.female_result, 0.9);
            assert.equal(testItemModelJson.account, "erhu65@gmail.com");
            assert.equal(testItemModel.sid_profile, sid_profile);

        });


        it('Should add a female TestItem FSH  successfully  ', async function () {

            var testItemData = {
                account: "erhu65@gmail.com",
                createDate: Date(),
                cid_test_item: "123459",
                typeName: 'FSH',
                female_result: 0.78
            };

            let errs =  await TestItemModel.validationErrs(testItemData);
            assert.equal(errs, undefined);

            let accountDetailModel = await AccountDetailModel.getOneByAccount(testItemData.account);

            //debug1(`Should add a TestItem successfully accountDetailModel.sid_profile): ${util.inspect(accountDetailModel.sid_profile)}`);
            let sid_profile = accountDetailModel.sid_profile;
            testItemData.sid_profile = sid_profile;

            let testItemModel = await TestItemModel.createOneWithData(testItemData);


            let additionalFileMo1els1 = await testItemModel.getAllAdditionalFiles();
            assert.equal(additionalFileMo1els1.length, 0);


            let testItemModelJson =  await testItemModel.getJsonData();
            assert.equal(testItemModelJson.female_result, .78);
            assert.equal(testItemModelJson.account, "erhu65@gmail.com");
            assert.equal(testItemModel.sid_profile, sid_profile);

        });


    });



    describe('TestItem -> sync', function () {
        var aftre_3th_record_save_time;
        it('Should add 5 male testItem successfully', async function () {

            var accountCreateData = {
                "account":"peter-1@gmail.com",
                "firstName":"John",
                "lastName":"Douglas",
                "password":"123456",
                "gender":1,
                "birthday": new Date(),
                "height": 158,
                "weight": 58,
                "who_standard": '5',
                "apnsToken":"wirperiwpr932222"
            };

            await addAndEnableNewAccount(accountCreateData);
            let accountDetailModel = await AccountDetailModel.getBy_account("peter-1@gmail.com");

            var data = {profile:'contraception'};
            let accountDetailModelUpdated = await accountDetailModel.update(data);

            let accountProfileModel = await　accountDetailModelUpdated.currentProfile();

            var addNewTestItemTests = [
                {
                    account: "peter-1@gmail.com",
                    createDate: Date(),
                    cid_test_item: "8976665-1",
                    typeName: 'sperm',
                    motility: 0.1,
                    morphology: 0.2,
                    concentraction: 0.3,
                    sid_profile: accountProfileModel.sid_profile
                },
                {
                    account: "peter-1@gmail.com",
                    createDate: Date(),
                    cid_test_item: "8976665-2",
                    typeName: 'sperm',
                    motility: 0.1,
                    morphology: 0.2,
                    concentraction: 0.3,
                    sid_profile: accountProfileModel.sid_profile
                },
                {
                    account: "peter-1@gmail.com",
                    createDate: Date(),
                    cid_test_item: "8976665-3",
                    typeName: 'sperm',
                    motility: 0.1,
                    morphology: 0.2,
                    concentraction: 0.3,
                    sid_profile: accountProfileModel.sid_profile
                },
                {
                    account: "peter-1@gmail.com",
                    createDate: Date(),
                    cid_test_item: "8976665-4",
                    typeName: 'sperm',
                    motility: 0.1,
                    morphology: 0.2,
                    concentraction: 0.3,
                    sid_profile: accountProfileModel.sid_profile
                },
                {
                    account: "peter-1@gmail.com",
                    createDate: Date(),
                    cid_test_item: "8976665-5",
                    typeName: 'sperm',
                    motility: 0.1,
                    morphology: 0.2,
                    concentraction: 0.3,
                    sid_profile: accountProfileModel.sid_profile
                }
            ];

            var i = 1;
            for (let testData of addNewTestItemTests) {
                await addNewTestItem(testData);
                if(i == 3) {
                    aftre_3th_record_save_time = new Date();
                }
                await utils.delay(2000);
                i++;
            }

        });

        it('Should get testItemModel by ', async function () {
            let aftre_3th_record_save_time_stampt = aftre_3th_record_save_time.getTime();
            let accountDetailModel = await AccountDetailModel.getBy_account("peter-1@gmail.com");
            let testItemModels = await accountDetailModel.getTestItems_after_some_time(aftre_3th_record_save_time);
            let testItemModels2 = await accountDetailModel.getTestItems_after_some_time(aftre_3th_record_save_time_stampt);
            expect(testItemModels.length).to.equal(2);
            expect(testItemModels2.length).to.equal(2);
        });

    });

});

