var utils = require('../helpers/utils');
var AccountDetail = require('./AccountDetail');
var AccountProfile = require('./AccountProfile');
var AccountToken = require('./AccountToken');
var Account = require('./account');
var TestItem = require('./TestItem');
var AdditionalFile = require('./AdditionalFile');

exports.initWithConnection = function (mongoose) {

    var AccountAuthModel;
    var AccountDetailModel;
    var AccountTokenModel;
    var AccountProfileModel;
    var TestItemModel;
    var AdditionalFileModel;

    if (!exports.AccountModel) {
        AccountAuthModel = Account.initWithConnection(mongoose);
        exports.AccountModel = AccountAuthModel;
    }

    if (!exports.AccountDetailModel) {

        AccountDetailModel = AccountDetail.initWithConnection(mongoose);
        exports.AccountDetailModel =  AccountDetailModel;
    }

    if (!exports.AccountTokenModel) {

        AccountTokenModel =  AccountToken.initWithConnection(mongoose);
        exports.AccountTokenModel = AccountTokenModel;
    }

    if (!exports.AccountProfileModel) {
        AccountProfileModel = AccountProfile.initWithConnection(mongoose);
        exports.AccountProfileModel = AccountProfileModel;

    }

    if (!exports.TestItemModel) {
        TestItemModel = TestItem.initWithConnection(mongoose);
        exports.TestItemModel = TestItemModel;
    }
    if (!exports.AdditionalFileModel) {
        AdditionalFileModel = AdditionalFile.initWithConnection(mongoose);
        exports.AdditionalFileModel = AdditionalFileModel;
    }

    AccountDetail.setDependenceModels([exports.AccountProfileModel, exports.AccountTokenModel, exports.TestItemModel]);
    TestItem.setDependenceModels([exports.AdditionalFileModel]);

}

exports.AccountModel = null;
exports.AccountDetailModel = null;
exports.AccountTokenModel = null;
exports.AccountProfileModel = null;
exports.TestItemModel = null;
exports.AdditionalFileModel = null;