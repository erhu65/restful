/**
 * Created by peter on 17/04/2017.
 */
var utils = require('../helpers/utils');

exports.initWithConnection = function (mongoose) {

    var AdditionalFileModel;

    AdditionalFileSchema = new mongoose.Schema({
        sid_test_item: {
            type: String,
            required: [true, 'sid_test_item required']
        },
        url: {
            type:String,
            required: [true, 'url required']
        },
        serial: {
            type:Number,
            default: 1,
            required: [true, 'serial required']
        }
    });

    class AdditionalFileClass {

        // `sid_test_item` becomes a virtual
        get sid_additional_file () {
            return this._id.toString();
        }

        static createOneWithData  (AdditionalFileData) {

            let ps = new Promise(function(resolve, reject) {

                let additionalFileModel = new AdditionalFileModel(AdditionalFileData);

                additionalFileModel.save((err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(additionalFileModel);
                });
            });
            return ps
        }

        static getBy_sid_test_item  (sid_test_item ) {

            let ps = new Promise(function(resolve, reject) {

                let queryData = {
                    sid_test_item:sid_test_item
                };
                AdditionalFileModel.find(queryData).sort({ serial: 1 }).exec(function(err, additionalFileModels) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(additionalFileModels);
                    // show the admins in the past month
                });
            });
            return ps
        }

        /*
         set fullName(v) {
         const firstSpace = v.indexOf(' ');
         this.firstName = v.split(' ')[0];
         this.lastName = firstSpace === -1 ? '' : v.substr(firstSpace + 1);
         }

         // `getFullName()` becomes a document method
         getFullName() {
         return `${this.firstName} ${this.lastName}`;
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

    AdditionalFileSchema.loadClass(AdditionalFileClass);

    AdditionalFileSchema.pre('save', function (next) {

        next();
    });

    AdditionalFileModel = mongoose.model('additional_files', AdditionalFileSchema);
    exports.model = AdditionalFileModel;
    return AdditionalFileModel;
};