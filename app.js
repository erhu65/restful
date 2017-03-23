var express = require('express')
    , http = require('http')
    , path = require('path')
    , bodyParser = require('body-parser')
    , logger = require('morgan')
    , methodOverride = require('method-override')
    , errorHandler = require('errorhandler')
    , mongoose = require('mongoose')
    , dataservice = require('./modules/contactdataservice');
var app = express();
var url = require('url');
mongoose.Promise = global.Promise;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded()); // for parsing application/x-www-form-urlencoded

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}


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
mongoose.connect('mongodb://local.bonray.com.tw:27017/contacts', options, function (error) {
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

app.get('/contacts/:number', function(request, response) {

    console.log(request.url + ' : querying for ' + request.params.number);
    dataservice.findByNumber(Contact, request.params.number, response);
});


app.post('/contacts', function(request, response) {
    dataservice.update(Contact, request.body, response)
});

app.put('/contacts', function(request, response) {
    dataservice.create(Contact, request.body, response)
});


app.delete('/contacts/:primarycontactnumber', function(request, response) {
    console.log(dataservice.remove(Contact, request.params.primarycontactnumber, response));
});

app.get('/contacts', function(request, response) {

    dataservice.list(Contact, response);
});


function toContact(body)
{
    return new Contact(
        {
            firstname: body.firstname,
            lastname: body.lastname,
            title: body.title,
            company: body.company,
            jobtitle: body.jobtitle,
            primarycontactnumber: body.primarycontactnumber,
            othercontactnumbers: body.othercontactnumbers,
            primaryemailaddress: body.primaryemailaddress,
            emailaddresses: body.emailaddresses,
            groups: body.groups
        });
}



console.log('Running at port ' + app.get('port'));
http.createServer(app).listen(app.get('port'));