const Twitter = require('twitter-lite');
require('dotenv').config();
const db = require('./db');
const _ = require('lodash');
const TwitterUser = require('./controllers/TwitterUsers');

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });

//TODO: Rewrite functions using newer twitter-lite

//unfollows the specified user
const unfriendUser = async (users) => {
    let params = {id: users[0].userID}
    return client.post('friendships/destroy', params)
    .then(res => {
        return TwitterUser.updateUnfriended(res)
    })
    .catch(console.error)
}

//function whitelistUsers() should mark all users found in the array
//as whitelisted in the database
const whitelistUsers = async (users) => {
      return TwitterUser.whitelistUser(users)
}

//WORKING HELPER FUNCTIONS:

//currently manually gets  alist of users matching preset specifications
findUnfriendableUsers = async () => {
    return TwitterUser.findUnfriendable()
}

//returns array of all database users that have isFriend: true
const getSavedFriends = async () => {
    return TwitterUser.getFriends()
}

//returns array of all database users that have isFriend: true
const getSavedFollowers = async () => {
    return TwitterUser.getFollowers()
}

//returns total count of users in database marked isFriend
const friendCount = async () => {
    return TwitterUser.friendCount()
}

//returns total count of users in database marked isFollower
const followerCount = async () => {
    return TwitterUser.followerCount()
}

//returns list of all users leaned down to userID
const getAllUsers = async () => {
    return TwitterUser.findAllUsers()
}

//returns list of all users that @TankieNews follows, but do not follow us back
const disrespect = async () => {
    return TwitterUser.findNotFollowingBack();
}

//get user IDs of all users following @TankieNews, cursoring through if >5000
const getFollowerIDs = async (params, data) => {
    return client.get('followers/ids', params)
    .then(res => {
        data.push(res.ids);
        if (res.next_cursor > 0) {
            let params = {screen_name: 'Joshua4Congress', stringify_ids: true, cursor: res.next_cursor_str}
            return getFollowerIDs(params, data);
        }
        return data;
    })
    .catch(console.error)
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
    .catch(console.error)
}

exports.testFriend = async () => {
    let params = {screen_name: 'TankieNews', stringify_ids: true}
    return getFollowerIDs(params, [])
}

//stores all user IDs of followers to database along with isFollowed: true, and dateFollowed: current date/time
const cursorStoreFollowers = async (followers) => {
    return Promise.all(followers.map(block => {
        return TwitterUser.addFollowers(block);
    }))
    .catch(console.error)
}

//stores all user IDs of friends to database along with isFriend: true, and dateFriended: current date/time
const cursorStoreFriends = async (friends) => {
    return Promise.all(friends.map(block => {
        return TwitterUser.addFriends(block)
    }))
    .catch(console.error)
}

const updateFriends = async (friendIDs) => {
    return TwitterUser.removeFriends(friendIDs)
}

const updateFollowers = async (followerIDs) => {
    return TwitterUser.removeFollowers(followerIDs)
}
//Passed an array of all users, breaks that array into arrays with a maximum of 100 users
//creates a promise for each array of 100 users and then calls userLookup(), which returns a promise
//that is resolved when Twitter API sends user data back.
const getUserData = async (users) => {
    let userChunks = _.chunk(users, 100);
    //console.log(userChunks)
    return Promise.all(userChunks.map(chunk => {
        let params = {user_id: chunk.join()};
        //console.log(params)
        return userLookup(params)
    })).catch(err => {
        throw err
    })
}

//Returns a promise that is for array of user data from Twitter API
//that is submitted to insertUserInfo, which stores data to user Doc. in database
const userLookup = async (params) => {
    return client.post('users/lookup', params)
    .then(res => {
        return TwitterUser.insertUserInfo(res)
    })
    .catch(console.error)
}

//WORKING EXPORTED FUNCTIONS

//Chains together promises to get and store all friends/followers to database
//requests user data for all from Twitter API and stores to database
exports.addUsers = async function(){
    let followerIDs
    let friendIDs
    let params = {screen_name: 'TankieNews', stringify_ids: true};
    console.log('made it to getFollowerIDs call')
    return getFollowerIDs(params, [])
    .then(followers => {
        console.log(`made it to cursorStoreFollowers call`)
        followerIDs = followers.flat(1)
        //console.log(followerIDs)
        return cursorStoreFollowers(followers)
    })
    .then(() => {
        //console.log(followerIDs)
        console.log(`made it to updateFollowers call`)
        return updateFollowers(followerIDs)
    })
    .then(() => {
        console.log(`made it to getFriendsIDs call`)
        let params = {screen_name: 'TankieNews', stringify_ids: true};
        return getFriendIDs(params, [])
    })
    .then(friends => {
        console.log(`made it to cursorStoreFriends call`)
        friendIDs = friends.flat(1)
        return cursorStoreFriends(friends)
    })
    .then(() => {
        console.log(`made it to updateFriends call`)
        return updateFriends(friendIDs)
    })
    .then(() => {
        let users = _.union(followerIDs, friendIDs)
        console.log(`made it to getUserData call`)
        return getUserData(users)
    })
    .then(() => {
        console.log(`made it to findUnfriendableUsers call`)
        return findUnfriendableUsers()
    })
    .then(users => {
        console.log(`made it to unfriendUser call`)
        if(users[0] == null || users[0] == undefined){
            return console.log(`no more users matching unfriend criteria`)
        } else {
            console.log(users[0])
            return unfriendUser(users)
        }
    })
    .then(unfriended => {
        if (unfriended !== undefined){
            console.log(`User unfriended and updated in database:\n${unfriended}`)
        }
        console.log(`finished the function!!!\n`)        
    })
    .catch(console.error)
}