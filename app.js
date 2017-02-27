
var express = require('express')
    , http = require('http')
    , path = require('path')
    , bodyParser = require('body-parser')
    , logger = require('morgan')
    , methodOverride = require('method-override')
    , errorHandler = require('errorhandler')
    , mongoose = require('mongoose')
    , _v1 = require('./modules/contactdataservice_v1')
    , _v2 = require('./modules/contactdataservice_v2')
    , dataservice = require('./modules/contactdataservice');
var app = express();
var url = require('url');


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(methodOverride());
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

mongoose.Promise = global.Promise;

var options = {
    db: { native_parser: true },
    replset: { rs_name: 'myReplicaSetName' },
    user: 'admin',
    pass: 'admin123',
    auth: {
        authdb: 'admin'
    }
}
mongoose.connect('mongodb://172.20.10.4:27017/contacts', options, function(error) {
    if(error){
        console.log(error)
    }
    // Check error in initial connection. There is no 2nd param to the callback.
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


/*
* app.get('/contacts/:number', function(request, response) {

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

 * */


//v1


app.get('/v1/contacts/:primarycontactnumber', function(request, response) {

    console.log(request.url + ' : querying for ' + request.params.primarycontactnumber);
    _v1.findByNumber(Contact, request.params.primarycontactnumber, response);
});

app.post('/v1/contacts/', function(request, response) {
    _v1.update(Contact, request.body, response);
});

app.put('/v1/contacts/', function(request, response) {
    _v1.create(Contact, request.body, response);
});

app.delete('/v1/contacts/:primarycontactnumber', function(request, response) {
    _v1.remove(Contact, request.params.primarycontactnumber, response);
});

app.get('/v1/contacts/', function(request, response) {
    var get_params = url.parse(request.url, true).query;

    if (Object.keys(get_params).length == 0)
    {
        _v1.list(Contact, response);
    }
    else
    {
        var key = Object.keys(get_params)[0];
        var value = get_params[key];

        JSON.stringify(_v2.query_by_arg(Contact,
            key,
            value,
            response));
    }
});

//v1


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