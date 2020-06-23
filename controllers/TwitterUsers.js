const TwitterUser = require('../models/TwitterUsers');
const Twitter = require('../twitter_and_controller');

//adds userID to database for all users @TankieNews follows
//updates existing userID's to include isFriend: true (and timestamp if needed)
exports.addFriendsPromise = async function(ids){
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

//TODO: fix so that it's a callback
//marks users on the whitelist as isWhiteListed in database
exports.whitelistUser = function (response){
    TwitterUser.exists({ userID: response, isWhitelisted: true }).then(exists => {
        if (exists){
            console.log(`User ID # ${response} is already whitelisted in database`)
        } else {
            TwitterUser.findOneAndUpdate({userID: response}, {isWhitelisted: true}, {new: true, upsert: true}, function(err, user){
                if (err) throw err;
                console.log(`User ID # ${response} updated to be whitelisted: \n${user}`)
            });
        }
      })
}

//returns complete list and count of users in database
//that @TankieNews follows, but don't follow back
exports.findNotFollowingBack = function(cb){
    TwitterUser.find({isFollower: false, isFriend: true}).select('userID').lean().exec(function(err, users){
        if (err) return cb(err);
        return cb(null, users);
    });
}
//returns array of all database users that have isFollower: true
exports.getFollowers = function(cb){
    TwitterUser.find({isFollower: true}).select('userID').lean().exec(function(err, followers) {
        if (err) return cb(err);
        return cb(null, followers);
  });
}
//returns array of all database users that have isFriend: true
exports.getFriends = function(cb){
    TwitterUser.find({isFriend: true}).select('userID').lean().exec(function(err, friends) {
        if (err) return cb(err);
        return cb(null, friends);
  });
}
//returns count of users that @tankienews follows
exports.friendCount = function(cb){
    TwitterUser.countDocuments({isFriend: true}, function(err, count){
        if (err) cb(err);
        return cb(null, count)
        //console.log( "Number of docs: ", count );
    });
}

//returns count of users that follow @tankienews
exports.followerCount = function(cb){
    TwitterUser.countDocuments({isFollower: true}, function(err, count){
        if (err) cb(err);
        return cb(null, count)
        //console.log( "Number of docs: ", count );
    });
}

//returns total count of unique users in the database that follow @tankienews
exports.findUniqueUsers = function(cb){
    TwitterUser.countDocuments(function(err, count){
        if (err) cb(err);
        return cb(null, count);
    });
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


