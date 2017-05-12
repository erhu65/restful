/**
 * Created by peter on 16/04/2017.
 */
var utils = require('../helpers/utils');

var AdditionalFileModel;


exports.setDependenceModels = function (models) {
    for (var i in models) {
        var model = models[i];
        if (model.modelName == 'additional_files') {
            AdditionalFileModel = model;
        }
    }
}

exports.initWithConnection = function (mongoose) {

    var TestItemModel;

    TestItemSchema = new mongoose.Schema({
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
        cid_test_item: {
            type:String,
            index: {unique: true},
            required: [true, 'cid_test_item required']
        },
        createDate: {
            type:Date,
            required: [true, 'createDate required']
        },
        typeName: {
            type:String,
            trim: true,
            enum:["sperm", "HCG", 'FSH', 'LH', 'BBT', 'mating'],
            required: [true, 'typeName required']
        },
        motility: {
            type:Number
        },
        morphology: {
            type:Number
        },
        concentraction: {
            type:Number
        },
        female_result: {
            type:Number,
        },
        sid_profile: {
            type:String
        },
        server_create_time: Date
    });

    TestItemSchema.statics.createOneWithData =  function(testItemData) {

        let ps = new Promise(function(resolve, reject) {

            let testItemModel = new TestItemModel(testItemData);

            testItemModel.save((err) => {
                if (err) {
                    return reject(err);
                }
                resolve(testItemModel);
            });

        });
        return ps
    };

    TestItemSchema.statics.validationErrs = function(testItemData) {

        let ps = new Promise(function(resolve, reject) {

            var testItemModel = new TestItemModel(testItemData);
            var validReport = testItemModel.validationErrs();
            resolve(validReport);
        });
        return ps;
    };

    TestItemSchema.methods.validationErrs = function() {
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
        return messages;
    };

    TestItemSchema.methods.getJsonData =  function() {

        var testItemModel = this;
        var self = this;
        let ps = new Promise(async function(resolve, reject) {

            var jsonObj = {
                account: testItemModel.account,
                cid_test_item: testItemModel.cid_test_item,
                sid_test_item: testItemModel.sid_test_item,
                createDate: testItemModel.createDate,
                typeName: testItemModel.typeName,
                motility: testItemModel.motility,
                morphology: testItemModel.morphology,
                concentraction: testItemModel.concentraction,
                server_create_time:self.server_create_time.getTime()
            };

            if (testItemModel.motility){
                jsonObj.motility = testItemModel.motility;
            }

            if (testItemModel.morphology){
                jsonObj.morphology = testItemModel.morphology;
            }

            if (testItemModel.concentraction){
                jsonObj.concentraction = testItemModel.concentraction;
            }

            if (testItemModel.female_result){
                jsonObj.female_result = testItemModel.female_result;
            }

            // let additionalFileModels = await testItemModel.getAllAdditionalFiles();
            // if (additionalFileModels && additionalFileModels.length == 1) {
            //
            //     jsonObj.url = additionalFileModels[0].url;
            // } else if  (additionalFileModels && additionalFileModels.length > 1) {
            //
            //     var additionalFiles = [];
            //
            //     for (const additionalFileModel of additionalFileModels) {
            //
            //         additionalFiles.push(additionalFileModel.url);
            //     }
            //
            //     jsonObj.urls = additionalFiles;
            // }

            resolve(jsonObj);
        });
        return ps;

    }

    class TestItemClass {

        // `sid_test_item` becomes a virtual
        get sid_test_item() {
            return this._id.toString();
        }


        static getBy_cid_test_item  (cid_test_item ) {

            let ps = new Promise(function(resolve, reject) {

                let queryData = {
                    cid_test_item:cid_test_item
                };
                TestItemModel.findOne(queryData, function(err, testItemModel) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if(testItemModel) {
                        return resolve(testItemModel);
                    }
                    resolve(null);
                    // show the admins in the past month
                });
            });
            return ps
        }


        static getBy_account  (account ) {
            let ps = new Promise(function(resolve, reject) {

                let queryData = {
                    account:account
                };
                TestItemModel.find(queryData).exec(function(err, testItemModels) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(testItemModels);
                });
            });
            return ps
        }

        static getBy_account_after_some_time  (account, sid_profile, time) {
            if ((typeof time) == 'number') {
                time = new Date(time);

            }
            let ps = new Promise(function(resolve, reject) {

                let queryData = {
                    account:account,
                    sid_profile: sid_profile
                };
                TestItemModel.find(queryData).where('server_create_time').gt(time).exec(function(err, testItemModels) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(testItemModels);
                });
            });
            return ps
        }

        // `addAdditionalFile()` becomes a document method

        async addAdditionalFile  (additionalFileData)  {

            let ps = new Promise(function(resolve, reject) {

                let additionalFileModel =  AdditionalFileModel.createOneWithData(additionalFileData);

                resolve(additionalFileModel);
            });

            return ps
        }

        async getAllAdditionalFiles  ()  {

            let testItem = this;
            let ps = new Promise(async function(resolve, reject) {
                let additionalFileModels = await AdditionalFileModel.getBy_sid_test_item(testItem.sid_test_item);
                resolve(additionalFileModels);
            });
            return ps;
        }

        /*
         set fullName(v) {
         const firstSpace = v.indexOf(' ');
         this.firstName = v.split(' ')[0];
         this.lastName = firstSpace === -1 ? '' : v.substr(firstSpace + 1);
         }

         // `findByFullName()` becomes a static
         static findByFullName(name) {
         const firstSpace = name.indexOf(' ');
         const firstName = name.split(' ')[0];
         const lastName = firstSpace === -1 ? '' : name.substr(firstSpace + 1);
         return this.findOne({ firstName, lastName });
         }
        * */

    }

    TestItemSchema.loadClass(TestItemClass);

    TestItemSchema.pre('save', function (next) {

        var currentData = new Date();

        if(!this.server_create_time){
            this.server_create_time = currentData;
        }
        next();
    });

    TestItemModel = mongoose.model('test_items', TestItemSchema);
    exports.model = TestItemModel;
    return TestItemModel;
};