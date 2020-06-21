var Twitter = require('twitter');
require('dotenv').config();
const db = require('./db');
const _ = require('lodash');
const TwitterUser = require('./controllers/TwitterUsers');
const TwitterUsers = require('./models/TwitterUsers');
var whiteListed = ['Craig_Brown','comradecarliv','HeyMaliniK','morbid_elation','aeracharrel'];
var whiteListedID = []
var testUnfollowUsers = ['742486603','16317345','1605827928','31196182','367843406','3274656996']

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });

//Functions to-do:
    //whitelist();

    //unfollow();

    //findVerified();

//Working Functions:

  //Returns count of users that @TankieNews follows
    //friendCount();

  //Returns count of users that follow @TankieNews
    //followerCount();

  //Returns count of unique users that are stored in the database
    //totalUsers();

  //Pulls list of users @TankieNews follows from Twitter API, then updates/adds database records
    addFriends();

  //Pulls list of users that follow @TankieNews from Twitter API, then updates/adds database records
    //addFollowers();

  //Returns list and count of all users that @TankieNews follows, but don't follow back 
    //disrespect();

  //Returns list of all database documents with isFollower: true
    //getFollowers();

  //Gets user data from all followers and inserts into the corresponding document in the database
    //getFollowerData()

  //Gets user data from all friends (that are not followers) and inserts into the corresponding document in the database
    //getFriendData()

////check users following @TankieNews and push to the following array
function addFriends(){
    var params = {screen_name: 'TankieNews', stringify_ids: true};
    client.get('friends/ids', params, function(err, response){
        if(err) throw err;
        for (var i = 0; i < response.ids.length; i++){
            //following.push(response.ids[i]);
            TwitterUser.addFriends(response.ids[i], function(err, user){
                if (err) throw err;
                console.log(`${user} updated in database.`);
            })
        }
        //console.log(following);
    });
}

//check @TankieNews followers and push to the followers array
function addFollowers(){
    var params = {screen_name: 'TankieNews', stringify_ids: true};
    client.get('followers/ids', params, function(err, response){
        if(err) throw err;
        for (var i = 0; i < response.ids.length; i++){
            //console.log('checking database for ID #: ' + response.ids[i])
            TwitterUser.addFollowers(response.ids[i], function(err, user){
                if (err) throw err;
                console.log(`${user} updated in database.`)
            })
        }
    });
}

//returns list of all users that @TankieNews follows, but do not follow us back
function disrespect(){
    TwitterUser.findNotFollowingBack(function(err, users){
        if (err) throw err;
        console.log(users)
        console.log(users.length)
    });
}

function friendCount(){
    TwitterUser.friendCount(function(err, count){
        if (err) throw err;
        console.log(count)
    })
}

function followerCount(){
    TwitterUser.followerCount(function(err, count){
        if (err) throw err;
        console.log(count)
    })
}

function totalUsers(){
    TwitterUser.findUniqueUsers(function(err, count){
        if (err) throw err;
        console.log(count)
    })
}

//get user info from all followers
function getFollowerData(){
    TwitterUser.getFollowers(function(err, followers){
        if (err) throw err;
        let followersChunk = _.chunk(followers, 100);
        //console.log(followersChunk)
        for (i=0; i<followersChunk.length; i++){
            let users = followersChunk[i].map(follower => follower)
            let userIDs = users.map(user => user.userID)
            let params = {user_id: userIDs.join()};
            client.post('users/lookup', params, function(err, response){
                if(err) throw err;
                //console.log(users)
                TwitterUser.insertUserInfo(users, response, function(err, userDoc){
                    if (err) throw err;
                    console.log(userDoc)
                })
            });
        }
    })
}

function getFriendData(){
    TwitterUser.getFriends(function(err, friends){
        if (err) throw err;
        let friendsChunk = _.chunk(friends, 100);
        //console.log(followersChunk)
        for (i=0; i<friendsChunk.length; i++){
            let users = friendsChunk[i].map(friend => friend)
            let userIDs = users.map(user => user.userID)
            let params = {user_id: userIDs.join()};
            client.post('users/lookup', params, function(err, response){
                if(err) throw err;
                //console.log(users)
                TwitterUser.insertUserInfo(users, response, function(err, userDoc){
                    if (err) throw err;
                    console.log(userDoc)
                })
            });
        }
    })
}
