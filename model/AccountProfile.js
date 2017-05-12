/**
 * Created by peter on 31/03/2017.
 */

var utils = require('../helpers/utils');

exports.initWithConnection = function (mongoose) {

    var AccountProfileModel;
//AccountProfile start
    AccountProfileSchema = new mongoose.Schema({
        sid_profile: String,
        account: {
            type: String,
            index: {unique: false},
            validate: {
                validator: function(v) {
                    return utils.validateEmail(v);
                },
                message: '{VALUE} is not a valid email'
            },
            required: [true, 'Account required']
        },
        name: {
            type: String,
            enum: ['contraception', 'conception', 'medication'],
            required: [true, 'Name required']
        },
        server_create_time: Date
    });

    AccountProfileSchema.statics.createOneWithData = function(accountProfileData, cb) {

        var accountProfileModel = new AccountProfileModel(accountProfileData);

        accountProfileModel.save(function (err) {
            if (err) {
                return cb(err);
            }
            cb(null, accountProfileModel);
        });
    };


    AccountProfileSchema.statics.validationReport = function(accountProfileCreateData) {

        var accountProfileModel = new AccountProfileModel(accountProfileCreateData);
        var validReport = accountProfileModel.validationReport();
        return validReport;
    };

    AccountProfileSchema.methods.validationReport = function() {
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

    AccountProfileSchema.pre('save', function (next) {
        var currentData = new Date();
        if(!this.server_create_time){
            this.server_create_time = currentData;
            this.sid_profile = this._id;
        }
        next();
    });


    class AccountProfileClass {

        static validate  (accountProfileCreateData) {
            var accountProfileModel = new AccountProfileModel(accountProfileCreateData);
            var validReport = accountProfileModel.validationReport();
            return validReport;
        }
    }

    AccountProfileSchema.loadClass(AccountProfileClass);
    AccountProfileModel = mongoose.model('account_profile', AccountProfileSchema);
    exports.model = AccountProfileModel;
    return AccountProfileModel;

};
//exports.model = null;


//AccountProfile end
