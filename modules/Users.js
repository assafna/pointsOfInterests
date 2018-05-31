var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var cors = require('cors');
var jwt = require('jsonwebtoken');
var DButilsAzure = require('./DButils');

var secret = 'superSecret';

//user login
router.post('/login', function(req, res){
    var userName = req.body.username;
    var password  = req.body.password;
    //checkif user exists
    DButilsAzure.execQuery("SELECT * FROM Users WHERE username = '" + userName + "'COLLATE SQL_Latin1_General_CP1_CS_AS AND password = '" + password + "' COLLATE SQL_Latin1_General_CP1_CS_AS")
    .then(function(result){
        if(result.length == 0){
            return res.json({success: false});
        }
        //create token
        var payload = {username: userName};
        var token = jwt.sign(payload, secret, {expiresIn: "1d"});
        console.log(token);
        console.log("login seccusfully");
        //return information including token
        return res.json({
            success: true,
            token: token
        });
    })
    //if user not found in table
    .catch(function(err){
        console.log(err);
        console.log("login failed");
        return res.json({
            success: false
        });
    });
});

//register new user to system
router.post('/register', function(req,res){
    
    //generaterandom username
    var generateUsername = new Promise(
        function(resolve, reject){
            var username = createRandomUsername();
            resolve(username);
        });

    //generate random password
    var generatePassword = new Promise(
        function(resolve,reject){
            var password = createRandomPassword();
            resolve(password);
        });
    //wait for 2 promises      
    Promise.all([generateUsername, generatePassword])
    .then(function(values){
        var username = values[0];
        var password = values[1];
        //add user
        var query = "INSERT INTO Users (username, password, firstName, lastName, city, country, email, Category1, Category2, Category3, Category4, verificationQues1, verificationQues2, verificationAns1, verificationAns2) VALUES ('" + username + "' ,'" + password + "' , ";
        for (var key in req.body) {
            if(key.localeCompare("verificationAns2") == 0)
                query += "'" + req.body[key] + "')";
            else
                query += "'" + req.body[key] + "', " 
      
      }
    
    DButilsAzure.execQuery(query)
    .then(function(result){
        var ans = {
            username: username,
            password: password
        }
        res.send(ans)
    })
    .catch(function(err){
        console.log(err);
    });

    })
});

//retrive password for user according to validation questions
router.post('/retrivePassword', function(req, res){
    var username = req.body.username;
    var verificationQues = req.body.verificationQues;
    var verificationAns = req.body.verificationAns;
    DButilsAzure.execQuery("SELECT password, verificationQues1, verificationQues2, verificationAns1, verificationAns2 FROM Users WHERE username='" + username + "' COLLATE SQL_Latin1_General_CP1_CS_AS")
    .then(function(result){
        //check if the ques and ans is correct
        if(verificationQues.localeCompare(result[0].verificationQues1) == 0 && verificationAns.localeCompare(result[0].verificationAns1) == 0 ||
            verificationQues.localeCompare(result[0].verificationQues2) == 0 && verificationAns.localeCompare(result[0].verificationAns2) == 0)
            return res.json({
                success: true,
                password: result[0].password
            });
        
        else{
            return res.json({
                success: false,
                message:"incorrect answer"
            });
        }
    })
    .catch(function(err){
        return res.json({
            success: false,
            message:"user not exist"
        });
    })
})




function createRandomUsername() {
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    return DButilsAzure.execQuery("SELECT username FROM Users")
    .then(function(result){
        while(true){
            var username = "";
            for (var i = 0; i < 8; i++)
                username += possible.charAt(Math.floor(Math.random() * possible.length));

                if(result.indexOf(username) < 0)
                    return username;   
        
        }                 
    })
    .catch(function(err){
        console.log(err);
    })

       
}

function createRandomPassword(){
    var password = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 10; i++)
        password += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return password;

}


module.exports = router;
