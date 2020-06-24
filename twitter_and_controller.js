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


//TODO: REWRITE USING PROMISES

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

//WORKING HELPER FUNCTIONS:

//get user IDs of all users following @TankieNews, cursoring through if >5000
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

//get user IDs of all users @TankieNews follows, cursoring through if >5000
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

//stores all user IDs of followers to database along with isFollowed: true, and dateFollowed: current date/time
const cursorStoreFollowers = async (followers) => {
    return Promise.all(followers.map(block => {
        return TwitterUser.addFollowers(block);
    }))
}

//stores all user IDs of friends to database along with isFriend: true, and dateFriended: current date/time
const cursorStoreFriends = async (friends) => {
    return Promise.all(friends.map(block => {
        return TwitterUser.addFriends(block);
    }))
}

//Passed an array of all users, breaks that array into arrays with a maximum of 100 users
//creates a promise for each array of 100 users and then calls userLookup(), which returns a promise
//that is resolved when Twitter API sends user data back.
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

//Returns a promise that is for array of user data from Twitter API
//that is submitted to insertUserInfo, which stores data to user Doc. in database
const userLookup = async (params) => {
    return client.post('users/lookup', params).then(response => {
        return TwitterUser.insertUserInfo(response).then(users => {
            return users;
        })
    })
}

//WORKING EXPORTED FUNCTIONS

//Chains together promises to get and store all friends/followers to database
//requests user data for all from Twitter API and stores to database
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