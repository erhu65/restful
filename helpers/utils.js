
var debugJson = require('debug')('bonraybio:jsonParser');
var config = require('../config.json');
const util = require('util');
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'Efeqd6*&df;aF3';
const fs = require('fs');
const path = require('path');
const fx = require('mkdir-recursive');
const nodemailer = require('nodemailer');
exports.make_error = function (errCode, msg) {
    var e = new Error(msg);
    e.code = errCode;
    return e;
}

exports.send_success_json = function (res, errMsg, data) {

    var output = { error: errMsg, data: data };
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify(output) + "\n");
}

exports.send_failure_json  = function (res, server_code, err) {
    res.writeHead(server_code, { "Content-Type" : "application/json" });
    res.end(JSON.stringify(err) + "\n");
}



exports.timeDiff = function (dateOld, dateNew, type) {
   if(type == 'sec') {
       var timeDiff = dateNew.getTime() - dateOld.getTime();
       var diffSecs = Math.round(timeDiff / 1000);
       return diffSecs
   }
}

exports.validateEmail = function(email) {

    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

exports.jsonParse = function(jsonStr) {
    var resObj;
    try {
         resObj = JSON.parse(jsonStr);

    }catch (e){
        return debugJson(`exception :${util.inspect(e)}}`);
    }
    return resObj;
}

exports.jsonStringify = function(jsonObj) {
    var jsonStr;
    try {
        jsonStr = JSON.stringify(jsonObj);
    }catch (e){
        return debugJson(`exception :${util.inspect(e)}}`);
    }
    return jsonStr;
}

exports.encrypt = function(text){
    var cipher = crypto.createCipher(algorithm,password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
}

exports.decrypt = function(text){
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
}

exports.pad = function(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}



// function to encode file data to base64 encoded string
exports.base64_encode = function (file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// function to create file from base64 encoded string
exports.base64_decode = function (base64str, file) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(file, bitmap);
}


exports.delay = function (interval) {

    return new Promise(function (resolve)  {
            setTimeout(resolve, interval);
    });
}

exports.rmDir = function(dirPath) {

    try { var files = fs.readdirSync(dirPath);
    }
    catch(e) {
        return;
    }
    if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
            var filePath = dirPath + '/' + files[i];
            if (fs.statSync(filePath).isFile())
                fs.unlinkSync(filePath);
            else
                rmDir(filePath);
        }
    fs.rmdirSync(dirPath);
    if (!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath);
    }
};

exports.mkDir = function(dir){
    fx.mkdir(dir, function(err) {

    });

}

exports.sendNotiEmailCrashWithMsg = function (msg, process) {
    // Use Smtp Protocol to send Email
    var smtpTransport = nodemailer.createTransport({
        service: config.nodemailer.service,
        host:config.nodemailer.host,
        port: config.nodemailer.port,
        auth: {
            user: config.nodemailer.auth.user,
            pass: config.nodemailer.auth.pass
        }
    });

    var mail = {
        from: `Bonraybio <${config.nodemailer.auth.user}>`,
        to:    config.problemMail,
        subject: `bonray server crash:${config.domain}`,
        text: msg
    }

    smtpTransport.sendMail(mail, function(err, response){
        if(err){
            //debuger(`mail send err: ${util.inspect(err)}`);
        }
        //debuger(`mail send res: ${util.inspect(response)}`);
        smtpTransport.close();
        console.error(msg);
        process.exit(1);
    });


}

// function DeviceDector () {
//
// }
//
// DeviceDector.prototype.whichType = function(req){
//
//     var userAgent = req.headers['user-agent'];
//     if(userAgent == config.deviceType.phone) {
//         return config.deviceType.phone;
//     } else {
//         return req.device.type;
//     }
// }
//
// var deviceDector = new DeviceDector();
//
// exports.deviceDector = deviceDector;
