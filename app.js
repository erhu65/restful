
/**
 * Module dependencies.
 */
//
var express = require('express');
var path = require('path');

var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var contacts = require('./modules/contacts');
var http = require('http');
var url = require('url');

var app = express();

app.get('/contacts',
    function(request, response){
        var get_params = url.parse(request.url, true).query;

        if (Object.keys(get_params).length === 0)
        {
            response.setHeader('content-type', 'application/json');
            response.end(JSON.stringify(contacts.list()));
        }
        else
        {
            response.setHeader('content-type', 'application/json');
            response.end(JSON.stringify(contacts.query_by_arg(get_params.arg, get_params.value)));
        }
    }
);


app.get('/contacts/:number', function(request, response) {
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(contacts.query(request.params.number)));
});

app.get('/groups', function(request, response) {
    console.log ('groups');
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(contacts.list_groups()));
});

app.get('/groups/:name', function(request, response) {
    console.log ('groups');
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(contacts.get_members(request.params.name)));
});




http.createServer(app).listen(3000, function(){
    console.log('Express server listening on port 3000');
});


// var express = require('express');
// var path = require('path');
// var favicon = require('serve-favicon');
// var logger = require('morgan');
// var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');
//
// var index = require('./routes/index');
// var users = require('./routes/users');
//
// var url = require('url')
// var app = express();
//
// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');
//
// // uncomment after placing your favicon in /public
// //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
//
// app.use('/', index);
// app.use('/users', users);
//
// app.get('/hello', function (request, response) {
//
//     //response.send('Hello route');
//
//     var get_params = url.parse(request.url, true).query;
//
//     if(Object.keys(get_params).length == 0){
//       response.end('Hello all');
//     } else {
//       response.end('Hello ' + get_params.name);
//
//     }
// });
//
// app.get('/hello/:name', function (request, response) {
//
//     response.send('Hello ' + request.params.name);
//
// });
//
//
//
//
//
//
//
//
// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });
//
// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });
//
// module.exports = app;
