var mongoose = require('mongoose');
//mongoose.Promise = global.Promise;

beforeEach(function (done) {


	  function clearDatabase() {
	    for (var i in mongoose.connection.collections) {
	      mongoose.connection.collections[i].remove(function() {});
	    }
	    return done();
	  }


	  if (mongoose.connection.readyState === 0) {

          var options = {
              db: {native_parser: true},
              replset:{rs_name: 'myReplicaSetName'},
              user: 'admin',
              pass: 'admin123',
              auth:{
                  authdb: 'admin'
              }
          };
          mongoose.connect('mongodb://local.bonray.com.tw:27017/contacts-test', options, function (err) {
              if (err) {
                  throw err;
              }
              return clearDatabase();
          });

	  } else {
	    return clearDatabase();
	  }
	});


	afterEach(function (done) {
	  mongoose.disconnect();
	  return done();
	});
