var mongoose = require('mongoose');
//mongoose.Promise = global.Promise;

var should = require('should');
var prepare = require('./prepare');



//用這種方式，DB不存在時，會自動產生
var options = {
    db: {native_parser: true},
    replset:{rs_name: 'myReplicaSetName'},
    user: 'admin',
    pass: 'admin123',
    auth:{
        authdb: 'admin'
    }
};
mongoose.connect('mongodb://local.bonray.com.tw:27017/contacts-test', options, function (error) {
    if(error) {
        console.log('Mongoose default connection open to ');
        return
    }

});

mongoose.connection.on('connected', function () {
   console.log('Mongoose default connection open to ');
});

var contactSchema = new mongoose.Schema({
	primarycontactnumber: {type: String, index: {unique: true}},
	firstname: String,
	lastname: String,
	title: String,
	company: String,
	jobtitle: String,	
	othercontactnumbers: [String],
	primaryemailaddress: String,
	emailaddresses: [String],
	groups: [String]
});

var Contact = mongoose.model('Contact', contactSchema);

describe('Contact: models', function () {


  describe('#create()', function () {
    it('Should create a new Contact', function (done) {
      
      var contactModel = {
    		  "firstname":"John",
    		  "lastname":"Douglas",
    		  "title":"Mr.",
    		  "company":"Dev Inc.",
    		  "jobtitle":"Developer",
    		  "primarycontactnumber":"+359777223345",
    		  "primaryemailaddress":"john.douglas@xyz.com",
    		  "groups":["Dev"],
    		  "emailaddresses":["j.douglas@xyz.com"],
    		  "othercontactnumbers":['+359777223346','+359777223347']
      };
      
      Contact.create(contactModel, function (err, createdModel) {
        // Check that no error occured
        should.not.exist(err);
        // Assert that the returned contact has  is what we expect
        
        createdModel.firstname.should.equal('John');
        createdModel.lastname.should.equal('Douglas');
        createdModel.title.should.equal('Mr.');
        createdModel.jobtitle.should.equal('Developer');
        createdModel.primarycontactnumber.should.equal('+359777223345');
        createdModel.primaryemailaddress.should.equal('john.douglas@xyz.com');
        createdModel.groups[0].should.equal('Dev');
        createdModel.emailaddresses[0].should.equal('j.douglas@xyz.com');
        createdModel.othercontactnumbers[0].should.equal('+359777223346');
        createdModel.othercontactnumbers[1].should.equal('+359777223347');
        //Notify mocha that the test has completed
        done();
      });
    });
  });


    describe('#create()2', function () {
        it('Should create a new Contact2', function (done) {
            var name = 'John';

            name.should.equal('John');

            //Notify mocha that the test has completed
            done();
        });
    });



});

