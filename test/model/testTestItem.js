/**
 * Created by peter on 16/04/2017.
 */
var utils = require('../../helpers/utils');
const util = require('util');
const assert = require('assert');
var should = require('should');
var async = require('async');
var mongoosePrepare = require('../../model/mongoosePrepare');
var debug1 = require('debug')('bonraybio:testTestItem');

var bonrayboi = require('../../model/bonraybio');
var AccountDetailModel;
var AccountTokenModel;
var AccountProfileModel;
var TestItemModel;

var config = require('../../config.json');
var connectUrl = `mongodb://${config.mongodb.server}:27017/bonraybio-test`;
var mongoose;

return;
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


describe('testItesms: models', function () {

    it('Should add at test Account successfully ', function (done) {

        var accountCreateData = {
            "account":"erhu66@gmail.com",
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


    it('Should pass  account profile validation and add one by account', function (done) {

        async.waterfall([
            function(callback) {
                AccountDetailModel.findOne({account: 'erhu66@gmail.com'}, function (err, accountDetailModel) {
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
                    callback(null, accountDetailModel, accountProfileModel);
                });

            }
        ], function (err, accountDetailModel, accountProfileModel) {
            if (err) {
                return done(err);
            }

            accountDetailModel.getProfiles(function (err, accountProfilesModels) {

                if(accountProfilesModels.length > 0){
                    for (var i=0; i<accountProfilesModels.length; i++) {
                        var accountProfilesModel = accountProfilesModels[i];
                        assert.equal(accountProfilesModel.account, 'erhu66@gmail.com');
                        assert.equal(accountProfileModel.name, 'contraception');
                    }
                    done();
                }
            });

        });
    });

    it('Should detect validation errors ', async function () {

        var testItemData = {
            //account: "erhu66@gmail.com",
            createDate: Date(),
            cid: "123456",
            typeName: 'sperm'
        };
        let errs =  await TestItemModel.validationErrs(testItemData);
        //debug1(`Should detect validation errors: ${util.inspect(errs)}`);
        let errCount = errs.length;
        assert.equal(true, (errCount > 0));


        testItemData = {
            //account: "erhu66@gmail.com",
            createDate: Date(),
            cid: "123456",
            typeName: 'sperm'
        };
        let errs2 =  await TestItemModel.validationErrs(testItemData);
        let errStr = errs2[0];
        assert.equal(errStr, 'Account required');

         testItemData = {
            account: "erhu6gmail.com",
            createDate: Date(),
            cid: "123456",
            typeName: 'sperm'
        };
        errs2 =  await TestItemModel.validationErrs(testItemData);
        errStr = errs2[0];
        assert.equal(errStr, 'erhu6gmail.com is not a valid email');

        testItemData = {
            account: "erhu66@gmail.com",
            //createDate: Date(),
            cid: "123456",
            typeName: 'Sperm'
        };
        errs2 =  await TestItemModel.validationErrs(testItemData);
        errStr = errs2[0];
        assert.equal(errStr, 'createDate required');

        testItemData = {
            account: "erhu66@gmail.com",
            createDate: Date(),
            //cid: "123456",
            typeName: 'sperm'
        };
        errs2 =  await TestItemModel.validationErrs(testItemData);
        errStr = errs2[0];
        assert.equal(errStr, 'cid required');

        testItemData = {
            account: "erhu66@gmail.com",
            createDate: Date(),
            cid: "123456",
            //typeName: 'Sperm'
        };
        errs2 =  await TestItemModel.validationErrs(testItemData);
        errStr = errs2[0];
        assert.equal(errStr, 'typeName required');

        testItemData = {
            account: "erhu66@gmail.com",
            createDate: Date(),
            cid: "123456",
            typeName: 'XXX'
        };
        errs2 =  await TestItemModel.validationErrs(testItemData);
        errStr = errs2[0];
        assert.equal(errStr, '`XXX` is not a valid enum value for path `typeName`.');

    });


    it('Should add a TestItem successfully', async function () {

        let testItemData = {
            account: "erhu66@gmail.com",
            createDate: Date(),
            cid: "123456",
            typeName: 'sperm'
        };
        let errs =  await TestItemModel.validationErrs(testItemData);
        assert.equal(errs, undefined);

    });
});

