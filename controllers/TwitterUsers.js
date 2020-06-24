const TwitterUser = require('../models/TwitterUsers');
const Twitter = require('../twitter_and_controller');

//TODO FUNCTIONS: ADD FUNCTIONALITY AND PROMISIFY EACH

//marks users on the whitelist as isWhiteListed in database 
//TODO: WHITELIST ALL USERS THAT MEET THRESHOLDS LIKE MORE THAN X # OF FOLLOWERS
//Currently broken because of the pre hook in the TwitterUser db schema
exports.whitelistUser = function (users){
    return Promise.all(users.map(user => {
        return TwitterUser.findOneAndUpdate({handle: user}, {isWhitelisted: true}).exec().then(user => {
            return user;
        })
    }))
}

//WORKING FUNCTIONS:

//adds userID to database for all users @TankieNews follows
//updates existing userID's to include isFriend: true (and timestamp if needed)
exports.addFriends = async function(ids){
    let date = new Date();
    return Promise.all(ids.map(id => {
        return TwitterUser.findOne({userID: id}).exec().then(result => {
            if(!result){
                let newUser = new TwitterUser ({
                    userID: id,
                    isFriend: true,
                    dateFriended: date
                })
                return newUser.save().then(user => {
                    return user;
                })
            } else if(result.isFriend == false){
                let updatedUser = {
                    isFriend: true,
                    dateFriended: date
                }
                return TwitterUser.findByIdAndUpdate({_id: result._id}, {$set: updatedUser}).exec().then(user => {
                    return user;
                })
            } else if(result.isFriend == true && !result.dateFriended){
                let updatedUser = {
                    isFriend: true,
                    dateFriended: date
                }
                return TwitterUser.findByIdAndUpdate({_id: result._id}, {$set: updatedUser}).exec().then(user => {
                    return user;
                })
            } else {
                return result;
            }
        })
    }))
}

//adds userID to database for all users following @TankieNews
//updates existing userID's to include isFollower: true (and timestamp if needed)
exports.addFollowers = async function(ids){
    let date = new Date();
    return Promise.all(ids.map(id => {
        return TwitterUser.findOne({userID: id}).exec().then(result => {
            if(!result){
                let newUser = new TwitterUser ({
                    userID: id,
                    isFollower: true,
                    dateFollowed: date
                })
                return newUser.save().then(user => {
                    return user;
                })
            } else if(result.isFollower == false){
                let updatedUser = {
                    isFollower: true,
                    dateFollowed: date
                }
                return TwitterUser.findByIdAndUpdate({_id: result._id}, {$set: updatedUser}).exec().then(user => {
                    return user;
                })
            } else if(result.isFollower == true && !result.dateFollowed){
                let updatedUser = {
                    isFollower: true,
                    dateFollowed: date
                }
                return TwitterUser.findByIdAndUpdate({_id: result._id}, {$set: updatedUser}).exec().then(user => {
                    return user;
                })
            } else {
                return result;
            }
        })
    }))
}

//inserts user info into database and returns promise of the updated userDoc
exports.insertUserInfo = function(response){
    return Promise.all(response.map(user => {
        var updatedUser = {
            handle: user.screen_name,
            name: user.name,
            isVerified: user.verified,
            followersCount: user.followers_count,
            friendsCount: user.friends_count,
            isProtected: user.protected,
            accountCreatedDate: user.created_at,
            location: user.location,
            favoritesCount: user.favourites_count,
            statusesCount: user.statuses_count
        }
        return TwitterUser.findOneAndUpdate({userID: user.id_str}, {$set: updatedUser}).exec().then(userDoc => {
            return userDoc;
        })
    }))
}

//returns complete list and count of users in database
//that @TankieNews follows, but don't follow back
exports.findNotFollowingBack = async function(){
    return TwitterUser.find({isFollower: false, isFriend: true}).select('userID').lean().exec()
    .then(users => {
        return users
    })
}

//returns all users in database leaned down to userID (and _id)
exports.findAllUsers = async function(){
    return TwitterUser.find({}).select('userID').lean().exec()
    .then(users => {
        return users
    })
}

//returns count of users that @tankienews follows
exports.friendCount = async () => {
    return TwitterUser.countDocuments({isFriend: true}).exec().then(count => {
        return count;
    })
}

//returns count of users that follow @tankienews
exports.followerCount = async () => {
    return TwitterUser.countDocuments({isFollower: true}).exec().then(count => {
        return count;
    })
}

//returns array of all database users that have isFollower: true
exports.getFollowers = async () => {
    return TwitterUser.find({isFollower: true}).exec().then(followers => {
        return followers;
    })
}

//returns array of all database users that have isFriend: true
exports.getFriends = async () => {
    return TwitterUser.find({isFriend: true}).exec().then(friends => {
        return friends;
    })
}