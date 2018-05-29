//this is only an example, handling everything is yours responsibilty !

var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var jwt = require('jsonwebtoken');
var DButilsAzure = require('./modules/DButils');
var users = require('./modules/Users');
var locations = require('./modules/Locations');
var fs = require('fs');
var xml2js = require('xml2js');

var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var secret = "amit";

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

//-------------------------------------------------------------------------------------------------------------------
//get all categories
app.get("/Categories", function(req, res){
    DButilsAzure.execQuery("SELECT * FROM Categories")
    .then(function(result){
        res.send(result);
    })
 
})

//get information for specific location
app.get('/LocationInfo', function(req, res){
    var locationId = req.headers["locationid"];
    var location;

    DButilsAzure.execQuery("SELECT * FROM Locations WHERE id='" + locationId + "'")
    .then(function(result){
        location = result;
        updateNumOfViewers(result[0].numberOfViewers, locationId);
    })
    .then(function(result){
        return getLastReviewsForLocation(locationId);
    })
    
    .then(function(result){
        res.send(
            {locationObject: location,
            reviews: result}
        )
    })     
    .catch(function(err){
        console.log(err);
    })
   

})

//get all locations in system
app.get("/AllLocations", function(req,res){
    DButilsAzure.execQuery("SELECT * FROM Locations")
    .then(function(result){
        res.send(result);
    })
})


//check if array contains value
function contains(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i].localeCompare(obj) == 0) {
            return true;
        }
    }
    return false;
}

// get all countries in JSON format, to use for registration
app.get("/allCountries", function(req, res){
    var parser = new xml2js.Parser();
    fs.readFile('countries.xml', function(err, data) {
        parser.parseString(data, function (err, result) {
            res.send(result);
            console.log('Sent all countries');
        });
    });
});