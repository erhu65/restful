
var express = require('express')
    , http = require('http')
    , path = require('path')
    , bodyParser = require('body-parser')
    , logger = require('morgan')
    , methodOverride = require('method-override')
    , errorHandler = require('errorhandler')
    , mongoose = require('mongoose')
    , Grid = require('gridfs-stream')
    , expressPaginate = require('express-paginate')
    , mongoosePaginate = require('mongoose-paginate')
    , CacheControl = require("express-cache-control")
    , _v1 = require('./modules/contactdataservice_v1')
    , _v2 = require('./modules/contactdataservice_v2')
    ,passport = require('passport')
    , BasicStrategy = require('passport-http').BasicStrategy
    ,admin = require('./modules/admin')
    , dataservice = require('./modules/contactdataservice');
var app = express();
var url = require('url');

var cache = new CacheControl().middleware;

var cacheControl = require('express-cache-controller');

app.use(cacheControl());

app.use(cacheControl({
    maxAge: 60
}));


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(methodOverride());
app.use(expressPaginate.middleware(10,100));
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
var mongodb = mongoose.connection;

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

contactSchema.plugin(mongoosePaginate);
var Contact = mongoose.model('Contact', contactSchema);


var authUserSchema = new mongoose.Schema({
    username:  {type: String, index: {unique: true}},
    password: String,
    role: String,
});

var AuthUser = mongoose.model('AuthUser', authUserSchema);

var adminUser = new AuthUser({
    username: 'admin',
    password: 'admin',
    role: 'Admin'
});

adminUser.save(function(error) {
    if (!error) {
        adminUser.save();
        console.log('Creating Admin user');
    } else {
        console.log('Admin user already exist');
    }
});

passport.use(new BasicStrategy(
    function(username, password, done) {
        AuthUser.findOne({username: username, password:  password},
            function(error, user) {
                if (error) {
                    console.log(error);
                    return done(error);
                } else {
                    if (!user) {
                        console.log(user);
                        console.log('unknown user');
                        return done(error);
                    } else {
                        console.log(user.username + ' authenticated successfully');
                        return done(null, user);
                    }
                }
            });
    }));


app.get('/contacts', function(request, response) {
    response.cacheControl = {
        maxAge: 120
    };
    var get_params = url.parse(request.url, true).query;


    if (Object.keys(get_params).length == 0)
    {
        _v2.list(Contact, response);
    }
    else
    {

        if (get_params['limit'] != null || get_params['page'] !=null)
        {
            _v2.paginate(Contact, request, response);
        }
        else
        {
            var key = Object.keys(get_params)[0];
            var value = get_params[key];

            _v2.query_by_arg(Contact,
                key,
                value,
                response);
        }
    }
});

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


app.get('/contacts/:primarycontactnumber/image', function(request, response){
    var gfs = Grid(mongodb.db, mongoose.mongo);
    _v2.getImage(gfs, request.params.primarycontactnumber, response);

})

app.post('/contacts/:primarycontactnumber/image', function(request, response){
    var gfs = Grid(mongodb.db, mongoose.mongo);
    _v2.updateImage(gfs, request, response);
})

app.delete('/contacts/:primarycontactnumber/image', function(request, response){
    var gfs = Grid(mongodb.db, mongoose.mongo);
    _v2.deleteImage(gfs, mongodb.db, request.params.primarycontactnumber, response);
});


app.get('/v2/contacts', function(request, response) {
    var get_params = url.parse(request.url, true).query;

    if (Object.keys(get_params).length == 0)
    {
        _v2.paginate(Contact, request, response);
    }
    else
    {

        if (get_params['limit'] != null || get_params['page'] !=null)
        {
            _v2.paginate(Contact, request, response);
        }
        else
        {
            var key = Object.keys(get_params)[0];
            var value = get_params[key];

            _v2.query_by_arg(Contact,
                key,
                value,
                response);
        }
    }
});


app.post('/admin'
    ,passport.authenticate('basic', {session: false})
    ,function(request, response) {

        authorize(request.user, response);
        if(!response.closed){

            admin.update(AuthUser, request.body, response);
        }

});


function authorize(user, response){
    console.log(user);
    if((user == null) || (user.role != 'Admin')) {
        response.writeHeader(403, {'Content-Type': 'text/plain'});
        response.end('Forbidden');
        consl
        return;
    }

}

app.get('/v2/contacts/:primarycontactnumber/image', function(request, response){
    var gfs = Grid(mongodb.db, mongoose.mongo);
    _v2.getImage(gfs, request.params.primarycontactnumber, response);

})


app.post('/v2/contacts/:primarycontactnumber/image', function(request, response){
    var gfs = Grid(mongodb.db, mongoose.mongo);
    _v2.updateImage(gfs, request, response);
})


app.delete('/v2/contacts/:primarycontactnumber/image', function(request, response){
    var gfs = Grid(mongodb.db, mongoose.mongo);
    _v2.deleteImage(gfs, mongodb.db, request.params.primarycontactnumber, response);
})




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