
var AccountModel;
exports.initWithConnection = function (mongoose) {

    const Schema = mongoose.Schema;
    const passportLocalMongoose = require('passport-local-mongoose');


    const Account = new Schema({
        account: String,
        password: String
    });

    Account.plugin(passportLocalMongoose, {usernameField: 'account'});


    class AccountClass {

        updatePassword (newPassword) {

            let self = this;

            let ps = new Promise(function(resolve, reject) {
                self.setPassword(newPassword, function(err, user) {
                    if (err) {
                        return reject(err);
                    }

                    user.save(function(err) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(user);
                    });
                });
            });
            return ps

        }

        static getBy_account  (account) {

            let ps = new Promise(function(resolve, reject) {

                let queryData = {
                    account:account
                };
                AccountModel.findOne(queryData, function(err, account) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (account) {
                        resolve(account);
                    } else {
                        resolve(null);
                    }

                    // show the admins in the past month
                });
            });
            return ps
        }
    }

    Account.loadClass(AccountClass);

    AccountModel = mongoose.model('account_auth', Account);
    module.exports = AccountModel;
    return AccountModel;
};


