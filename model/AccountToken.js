/**
 * Created by peter on 31/03/2017.
 */
var utils = require('../helpers/utils');

exports.initWithConnection = function (mongoose) {

    var AccountTokenModel;
//AccountToken start
    AccountTokenSchema = new mongoose.Schema({
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
        token: {
            type: String,
            required: [true, 'APNS token required']
        },
        server_create_time: Date
    });

    AccountTokenSchema.statics.createOneWithData = function(accountTokenData, cb) {

        var accountTokenModel = new AccountTokenModel(accountTokenData);

        accountTokenModel.save(function (err) {
            if (err) {
                return cb(err);
            }
            cb(null, accountTokenModel);
        });
    };


    AccountTokenSchema.statics.validationReport = function(accountTokenCreateData) {

        var accountTokenModel = new AccountTokenModel(accountTokenCreateData);
        var validReport = accountTokenModel.validationReport();
        return validReport;
    };

    AccountTokenSchema.methods.validationReport = function() {
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

    AccountTokenSchema.pre('save', function (next) {
        var currentData = new Date();
        if(!this.server_create_time){
            this.server_create_time = currentData;
        }
        next();
    });

    AccountTokenModel = mongoose.model('account_apns', AccountTokenSchema);
    exports.model = AccountTokenModel;
    return AccountTokenModel;

};
//exports.model = null;

//AccountToken end