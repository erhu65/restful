var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
exports.init =  function  (connectUrl, options, cb) {

      mongoose.connect(connectUrl, options,  function (err) {
        if (mongoose.connection.readyState  == 1) {
            exports.mongoose = mongoose;
            return cb(null, mongoose);
        }
        if (err) {
            cb(err) ;
            process.exit(1);

        }

        exports.mongoose = mongoose;
        cb(null, mongoose);
    });


}

exports.mongoose = null;
