var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var jwt = require('jsonwebtoken');

var fs = require('fs');
var xml2js = require('xml2js');
var DButilsAzure = require('./modules/DButils');
var users = require('./modules/Users');
var locations = require('./modules/Locations');
var general = require('./modules/General');


var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var secret = "superSecret";

var port = 3000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});

//verify user token
app.use('/reg', function(req, res, next){
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    //decode token
    if(token){      
        jwt.verify(token, secret, function(err, decoded){
            if(err){
                return res.json({success:false, message:'Failed to authenticate token.'});
            }
            else{//decode token
                var decoded = jwt.decode(token,{complete:true});
                req.decode = decoded;
                next();
            }
        })
    }
});

app.use('/users', users);
app.use('/reg/locations', locations);
app.use('/general', general)

//-------------------------------------------------------------------------------------------------------------------
