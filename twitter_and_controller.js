var Twitter = require('twitter');
require('dotenv').config();
const db = require('./db');
const _ = require('lodash');
const TwitterUser = require('./controllers/TwitterUsers');
//const TwitterUsers = require('./models/TwitterUsers');
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
    //addFriends();

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

const getFollowerIDs = async (params, data) => {
    return client.get('followers/ids', params)
    .then(res => {
        console.log(res)
        data.push(res.ids);
        if (res.next_cursor > 0) {
            let params = {screen_name: 'TankieNews', stringify_ids: true, cursor: res.next_cursor_str}
            return getFollowerIDs(params, data);
        }
        return data;
    })
}
const getFriendIDs = async (params, data) => {
    return client.get('friends/ids', params)
    .then(res => {
        data.push(res.ids);
        if (res.next_cursor > 0) {
            let params = {screen_name: 'TankieNews', stringify_ids: true, cursor: res.next_cursor_str}
            return getFriendIDs(params, data);
        }
        return data;
    })
}

const cursorStoreFollowers = async (followers) => {
    return Promise.all(followers.map(block => {
        return TwitterUser.addFollowers(block);
    }))
}

const cursorStoreFriends = async (friends) => {
    return Promise.all(friends.map(block => {
        return TwitterUser.addFriends(block);
    }))
}

exports.addUsers = async function(){
    let params = {screen_name: 'TankieNews', stringify_ids: true};
    getFollowerIDs(params, [])
    .then(followers => {
        console.log(`made it to cursorStoreFollowers call`)
        return cursorStoreFollowers(followers)
    })
    .then(() => {
        console.log(`made it to getFriendsIDs call`)
        let params = {screen_name: 'TankieNews', stringify_ids: true};
        return getFriendIDs(params, [])
    })
    .then(friends => {
        console.log(`made it to cursorStoreFriends call`)
        return cursorStoreFriends(friends)
    })
    .then(() => {
        console.log(`made it to findAllUsers call`)
        return TwitterUser.findAllUsers();
    })
    .then(users => {
        console.log(`made it to getUserData call`)
        return getUserData(users);
    })
    .then(() => {
        console.log(`completed addUsers call`)
    })
    .catch(error => {
        throw error;
    })
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

const userLookup = async (params) => {
    return client.post('users/lookup', params).then(response => {
        //console.log(result)
        return TwitterUser.insertUserInfo(response).then(user => {
            return user;
        })
    })
}
const getUserData = async (users) => {
    let userChunks = _.chunk(users, 100);
    //console.log(userChunks)
    return Promise.all(userChunks.map(user => {
        let ids = user.map(user => user.userID)
        let params = {user_id: ids.join()};
        //console.log(params)
        return userLookup(params)
    }))
}