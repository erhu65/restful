/**
 * Created by peter on 31/03/2017.
 */
//AccountDetail start

var utils = require('../helpers/utils');
var util = require('util');
var debugA = require('debug')('bonraybio:model/AccountDetail');
var async = require('async');

var AccountTokenModel;
var AccountProfileModel;
var AccountDetailModel;
var TestItemModel;

exports.setDependenceModels = function (models) {
    for (var i in models) {
        var model = models[i];
        if (model.modelName == 'account_apns') {
            AccountTokenModel = model;
        }
        if (model.modelName == 'account_profile') {
            AccountProfileModel = model;
        }
        if (model.modelName == 'test_items') {
            TestItemModel = model;
        }

    }
}

exports.initWithConnection = function (mongoose) {

    AccountDetailModelSchema = new mongoose.Schema({
        account: {
            type: String,
            index: {unique: true},
            validate: {
                validator: function(v) {
                    return utils.validateEmail(v);
                },
                message: '{VALUE} is not a valid email'
            },
            required: [true, 'Account required']
        },
        role: {
            type: Number,
            enum: [1, 2, 3],
            default: 1
        },//1: person, 2:doctor, 3:admin
        firstName: {
            type: String,
            required: [true, 'first name required']
        },
        lastName: {
            type: String,
            required: [true, 'last name required']
        },
        password: {
            type: String
        },
        latest_login_time: {
            type: Date
        },
        is_allow_mutiple_device_login: {
            type:Boolean,
            default: true
        },
        gender:{
            type: Number,
            required:[true, 'Gender required'],
            enum: [0, 1]
        },
        spouse: {
            type:String
        },
        is_active: {
            type:Boolean,
            default: false
        },
        sid_profile: {
            type: String
        },
        birthday: Date,
        height: {
            type:Number
        },
        weight: {
            type:Number
        },
        who_standard: {
            type:String,
            enum: ['4', '5'],
            default: '4'
        },
        active_key: String,
        server_create_time: Date,
        server_update_time: Date
    });

    AccountDetailModelSchema.virtual('fullName').get(function () {
        return this.firstName + ' ' + this.lastName;
    });

    AccountDetailModelSchema.pre('save', function (next) {
        var currentData = new Date();
        this.server_update_time = currentData;

        if(!this.server_create_time){
            this.server_create_time = currentData;
            this.active_key = this._id;
            this.is_active = false;
        }
        next();
    });


    AccountDetailModelSchema.methods.validationReport = function() {
        var validErr = this.validateSync();
        if(!validErr){
            return;
        }
        var errs = validErr.errors;

        var errReport;
        var messages = [];

        for (var key in errs) {
            if (errs.hasOwnProperty(key)) {
                fieldErrObj = errs[key]
                messages.push(fieldErrObj.message);

            }
        }
        errReport = messages.join("\n");

        return errReport;
    };


    AccountDetailModelSchema.methods.apnsTokens = function(cb) {

        var _account = this.account;
        AccountTokenModel.find({account:_account}, function (err, accountTokenlModels) {
            if(err){
                return cb(err);
            }
            cb(null, accountTokenlModels);
        });
    };

    AccountDetailModelSchema.methods.addApnsToken = function(apnsToken, cb) {

        var data = {
            account: this.account,
            token: apnsToken
        };

        AccountTokenModel.createOneWithData(data, function(err, accountTokenModel) {
            if(err){
                return cb(err);
            }

            cb(null, accountTokenModel);
        });
    };

    AccountDetailModelSchema.methods.removeApnsToken = function(cb) {

        var accountDetailModel = this;
        this.apnsTokens(function (err, accountTokenModels) {

            for (var i=0; i<accountTokenModels.length; i++) {
                var accountTokenModel = accountTokenModels[i];

                accountTokenModel.remove({account:accountDetailModel.account}, function (err) {
                    if(err){
                        return cb(err);
                    }

                });
            }
        })

    };

    AccountDetailModelSchema.methods.updateProfile = function(profileData, cb) {

        let  self = this;

        var data = {
            account: self.account,
            name: profileData.name
        };
        const  cb1 = cb;

        //TODO: clear old reminder by old sid_profile
        AccountProfileModel.createOneWithData(data, function(err, accountProfileModel) {
            if(err){
                return cb1(err);
            }
            self.sid_profile = accountProfileModel.sid_profile;
            self.save(function (err) {
                if(err){
                    return cb1(err);
                }
                cb1(null, self);
            });
        });
    };

    AccountDetailModelSchema.methods.getProfiles = function(cb) {

        var _account = this.account;
        AccountProfileModel.find({account:_account}, function (err, accountProfileModels) {
            if(err){
                return cb(err);
            }
            cb(null, accountProfileModels);
        });
    };

    AccountDetailModelSchema.methods.getCurrentProfile = function(cb) {

        var _account = this.account;
        var queryData = {account:_account,
            sid_profile: this.sid_profile};
        AccountProfileModel.find(queryData, function (err, accountProfileModels) {
            if(err){
                return cb(err);
            }
            cb(null, accountProfileModels[0]);
        });
    };

    AccountDetailModelSchema.methods.enable = function(cb) {

        var enableData = {
            is_active: true,
            password: null
        };

        AccountDetailModel.findByAccountAndUpdate(this.account, enableData, function (err, accountDetailModel) {
            if (err) {
                return cb(err);
            }
            cb(null, accountDetailModel);
        });
    };

    AccountDetailModelSchema.methods.getJsonData = function (cb) {

        var cb1 = cb;
        var accountDetailModel = this;

        async.waterfall([

            function(callback) {
                var cb2 = callback;

                accountDetailModel.getCurrentProfile(function (err, accountProfileModel) {
                    if(err) {
                        return cb2(err);
                    }
                    cb2(null, accountDetailModel, accountProfileModel);
                });
            },
            function(accountDetailModel, accountProfileModel, callback) {
                var cb3 = callback;
                accountDetailModel.apnsTokens(function (err, accountTokenModels) {
                    if (err) {
                        return cb3(err);
                    }

                    cb3(null, accountDetailModel, accountProfileModel, accountTokenModels);
                });

            }
        ], function (err, accountDetailModel, accountProfileModel, accountTokenModels) {
            if (err) {
                return cb1(err);
            }
            var apnsTokens = [];

            for (var i=0; i<accountTokenModels.length; i++) {
                var accountTokenModel = accountTokenModels[i];
                apnsTokens.push(accountTokenModel.token);
            }
            var json = {
                account: accountDetailModel.account,
                fullName:accountDetailModel.fullName,
                firstName: accountDetailModel.firstName,
                lastName: accountDetailModel.lastName,
                gender: accountDetailModel.gender,
                spouse: accountDetailModel.spouse,
                birthday: accountDetailModel.birthady,
                height: accountDetailModel.height,
                weight: accountDetailModel.weight,
                who_standard: accountDetailModel.who_standard,
                is_allow_mutiple_device_login: accountDetailModel.is_allow_mutiple_device_login,
                apnsTokens: apnsTokens
            };

            if(accountProfileModel){
                json.profile =  accountProfileModel.name;
            }
            cb1(null, json);

        });


    };


    AccountDetailModelSchema.statics.validationReport = function(accountCreateData) {

        var accountDetailModel = new AccountDetailModel(accountCreateData);
        var validReport = accountDetailModel.validationReport();
        return validReport;
    };

    AccountDetailModelSchema.statics.createOneWithData = function(accountCreateData, cb) {

        var apnsToken = accountCreateData.apnsToken;
        delete  accountCreateData.apnsToken;
        var accountDetailModel = new AccountDetailModel(accountCreateData);

        accountDetailModel.save(function (err) {
            if (err) {
                return cb(err);
            }

            if(apnsToken){
                var tokenData =  {
                    account: accountCreateData.account,
                    token:apnsToken
                };

                accountDetailModel.addApnsToken(apnsToken, function (err, accountTokenModel) {
                    if (err) {
                        return cb(err);
                    }
                });
            }
            cb(null, accountDetailModel);

        });
    };

    AccountDetailModelSchema.statics.getOneByAccount  = (account) => {
        let ps = new Promise(function(resolve, reject) {
            let qeuryData = {
                account: account,
                is_active: true
            };
            AccountDetailModel.findOne(qeuryData, function (err, accountDetailModel) {
                if (err) {
                    return reject(err);
                }

                if(!accountDetailModel){
                    let err = new Error("not_found")
                    return reject(err);
                }
                resolve(accountDetailModel);
            });
        });
        return ps;
    };

    AccountDetailModelSchema.statics.findByAccountAndUpdate = function(account, data, cb) {

        var apnsToken = data.apnsToken;

        AccountDetailModel.findOneAndUpdate({account: account},  {$set:data}, {new: true}, function (err, accountDetailModel) {
            if (err) {
                return cb(err);
            }
            accountDetailModel.server_update_time = new Date();
            accountDetailModel.save(function (err) {
                if (err) {
                    return cb(err);
                }

                if(apnsToken){
                    var tokenData =  {
                        account: account,
                        token:apnsToken
                    };

                    accountDetailModel.addApnsToken(apnsToken, function (err, accountTokenModel) {
                        if (err) {
                            return cb(err);
                        }
                    });
                }
                cb(null, accountDetailModel);
            });
        });
    };

    AccountDetailModelSchema.statics.removeIfNeed = function(dataRemove, cb) {

        AccountDetailModel.findOne(dataRemove, function (err, accountDetailModel) {
            if (err) {
                return cb(err);
            }

            if(!accountDetailModel){
                cb(null);
                return;
            }
            accountDetailModel.removeApnsToken(function (err) {
                if(err){
                    return cb(err);
                }
            });
            AccountDetailModel.remove(dataRemove, function (err) {
                if (err) {
                    return cb(err);
                }
                cb(null);
            });
        });

    };

    AccountDetailModelSchema.pre('save', function (next) {
        var currentData = new Date();
        this.server_update_time = currentData;

        if(!this.server_create_time){
            this.server_create_time = currentData;
            this.active_key = this._id;
            this.is_active = false;
        }
        next();
    });

    class AccountDetailClass {

        // `fullName` becomes a virtual
        get fullName() {
            return `${this.firstName} ${this.lastName}`;
        }

        getAccountJsonData () {
            let self = this;
            let ps = new Promise(async function(resolve, reject) {
                self.getJsonData(function (err, jsonData) {
                    if(err){
                        return reject(err);
                    }
                    return resolve(jsonData);
                });
            });
        return ps;
        }

        currentProfile() {
            let self = this;
            let ps = new Promise(function(resolve, reject) {
                self.getCurrentProfile(function (err, accountProfileModel) {
                    if(err) {
                        return reject(err);
                    }
                    resolve(accountProfileModel);
                });

            });
            return ps;
        }

        profile() {
            let self = this;
            let ps = new Promise(function(resolve, reject) {
                self.getCurrentProfile(function (err, accountProfileModel) {
                    if(err) {
                        return reject(err);
                    }
                    resolve(accountProfileModel.name);
                });

            });
            return ps;
        }

        // `getFullName()` becomes a document method
        update(dataToUpdate) {
            let self = this;
            let ps = new Promise(function(resolve, reject) {

                AccountDetailModel.findByAccountAndUpdate(self.account, dataToUpdate, function (err, accountDetailModel) {
                    if (err) {
                        return reject(err);
                    }

                    if(!dataToUpdate.profile){
                        return resolve( accountDetailModel);
                    }
                    var data = {name: dataToUpdate.profile};
                    accountDetailModel.updateProfile(data, function (err, accountProfileModel) {
                        if (err) {
                            return reject(err);
                        }
                        return resolve( accountDetailModel);
                    });
                });


            });
            return ps;
        }

        getTestItems_after_some_time(time) {
            let self = this;
            let ps = new Promise(async function(resolve, reject) {
                let testItemModels = await TestItemModel.getBy_account_after_some_time(self.account, self.sid_profile, time);
                resolve(testItemModels);
            });
            return ps;
        }

        static getBy_account  (account) {

            let ps = new Promise(function(resolve, reject) {
                let queryData = {
                    account:account
                };

                AccountDetailModel.findOne(queryData, function(err, account) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (resolve) {
                        resolve(account);
                    } else {
                        resolve(null);
                    }
                });
            });
            return ps
        }

        static isExist (account) {
            let ps = new Promise(async function(resolve, reject) {

                let queryData =
                    {account:account,
                        is_active: true};

                AccountDetailModel.findOne(queryData, function (err, accountDetailModel) {
                    if (err) {
                        return reject(err);
                    }
                    if(accountDetailModel){
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
            });
            return ps;
        }
    }

    AccountDetailModelSchema.loadClass(AccountDetailClass);
    AccountDetailModel = mongoose.model('account_detail', AccountDetailModelSchema);
    exports.model = AccountDetailModel;
    return AccountDetailModel;
}

//
// exports.initWithConnection = function (mongoose) {
//
//
// };
//

