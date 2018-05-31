var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var cors = require('cors');
var jwt = require('jsonwebtoken');
var DButilsAzure = require('./DButils');

//get all categories
router.get("/allCategories", function(req, res){
    DButilsAzure.execQuery("SELECT * FROM Categories")
    .then(function(result){
        res.send(result);
    })
 
})


// get all countries in JSON format, to use for registration
router.get("/allCountries", function(req, res){
    var parser = new xml2js.Parser();
    fs.readFile('countries.xml', function(err, data) {
        parser.parseString(data, function (err, result) {
            res.send(result);
            console.log('Sent all countries');
        });
    });
});

//get all locations in system
router.get("/allLocations", function(req,res){
    DButilsAzure.execQuery("SELECT * FROM Locations")
    .then(function(result){
        res.send(result);
    })
})

//get 3 random location with rate above 4
//the method inside users mosule because all users can see random location
router.get('/randomPopularLocations', function(req, res){
    var ans = [];
    var locations;
    DButilsAzure.execQuery("SELECT * FROM Locations WHERE rate >= 4")
    .then(function(result){
        var indexes = [0, 1, 2];
        if(result.length > 3)
            indexes = chooseRandomIndexes(result.length);
        locations = [result[indexes[0]], result[indexes[1]], result[indexes[2]]];

    })
    .then(function(result){
        //find revies for first location
        var rev = getLastReviewsForLocation(locations[0].id);
        return rev;
    })
    .then(function(result){
        ans.push({
            location: locations[0],
            reviews: result
        })
        console.log(ans);
        //find revies for second location
        var rev = getLastReviewsForLocation(locations[1].id);
        return rev;
      
    })
    .then(function(result){
        ans.push({
            location: locations[1],
            reviews: result
        })
        //console.log(ans);

        //find revies for third location
        return getLastReviewsForLocation(locations[2].id)       
    })
    .then(function(result){
        ans.push({
            location: locations[2],
            reviews: result
        })
       // console.log(ans);

        res.send(ans);
    })

    .catch(function(err){
        console.log(err);
    })

})

//get information for specific location
router.get('/locationInfo', function(req, res){
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

function updateNumOfViewers(oldNum, locationId){
    console.log("num:" + oldNum);
    var newNum = parseInt(oldNum) + 1;
    return DButilsAzure.execQuery("UPDATE Locations SET numberOfViewers =" + newNum + " WHERE id=" + locationId)
    .then(function(result){
        var message = "added 1 to number of viewers";
        console.log(message);
    })
}

    function chooseRandomIndexes(total){
        var first = Math.floor((Math.random() * total));
        var second = Math.floor((Math.random() * total));
        while(first == second)
            second = Math.floor((Math.random() * total));
        var third = Math.floor((Math.random() * total));
        while(first == third || second == third)
            third = Math.floor((Math.random() * total));
        return [first, second, third];
        
    }
    
    //get 2 last reviews of location
    function getLastReviewsForLocation(locationId){
        return DButilsAzure.execQuery("SELECT * FROM ReviewsForLocation WHERE locationID='" + locationId + "'")
        .then(function(result){
            var sortedDates = result.map(function(item) {
                return new Date(item.reviewDate).getTime()
             }).sort(); 
             // take latest
             var first = new Date(sortedDates[sortedDates.length-1]);
             var second = new Date(sortedDates[sortedDates.length-2]);
             var reviews = [];
             for(var i = 0; i < result.length; i++){
                 if(result[i].reviewDate - first == 0 || result[i].reviewDate - second == 0)
                    reviews.push(result[i]);
             }
             return reviews;
        })
    }


module.exports = router;
