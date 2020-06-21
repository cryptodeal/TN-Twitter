const TwitterUser = require('../models/TwitterUsers');

//adds userID to database for all users @TankieNews follows
//updates existing userID's to include isFriend: true (and timestamp if needed)
exports.addFriends = function (response, cb){
    let date = new Date();
    TwitterUser.findOne({ userID: response }).then(user => {
        //if (err) return cb(err);
        if (!user){
            let newUser = new TwitterUser ({
                userID: response,
                isFriend: true,
                dateFriended: date
            })
            newUser.save(function(err, userDoc){
                if (err) return cb(err);
                return cb(null, userDoc);
            });
        } else if(user.isFriend == false){
            let updatedUser = {
                userID: response,
                isFriend: true,
                dateFriended: date
            }
            TwitterUser.findByIdAndUpdate({_id: user._id}, {$set: updatedUser}, function(err, userDoc){
                if (err) return cb(err);
                return cb(null, userDoc);
            });         
        } else if(user.isFriend == true && !user.dateFriended){
            let updatedUser = {
                userID: response,
                isFriend: true,
                dateFriended: date
            }
            TwitterUser.findByIdAndUpdate({_id: user._id}, {$set: updatedUser}, function(err, userDoc){
                if (err) return cb(err);
                return cb(null, userDoc);
            });         
        } else {
            return cb(null, user);
        }
      })
}

//adds userID to database for all users following @TankieNews
//updates existing userID's to include isFollower: true (and timestamp if needed)
exports.addFollowers = function (response, cb){
    let date = new Date();
    TwitterUser.findOne({ userID: response}).then(user => {
        if (!user){
            let newUser = new TwitterUser ({
                userID: response,
                isFollower: true,
                dateFollowed: date
            })
            newUser.save(function(err, userDoc){
                if (err) return cb(err);
                return cb(null, userDoc);
            });
        } else if(user.isFollower == false){
            let updatedUser = {
                userID: response,
                isFollower: true,
                dateFollowed: date
            }
            TwitterUser.findByIdAndUpdate({_id: user._id}, {$set: updatedUser}, function(err, userDoc){
                if (err) return cb(err);
                return cb(null, userDoc);
            });        
        } else if(user.isFollower == true && !user.dateFollowed){
            let updatedUser = {
                userID: response,
                isFollower: true,
                dateFollowed: date
            }
            TwitterUser.findByIdAndUpdate({_id: user._id}, {$set: updatedUser}, function(err, userDoc){
                if (err) return cb(err);
                return cb(null, userDoc);
            });       
        } else {
            return cb(null, user);
        }
      })
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

//inserts user info into database and returns callback of the updated userDoc
exports.insertUserInfo = function(users, response, cb){
    for (i=0; i<response.length; i++){
        var updatedUser = {
            handle: response[i].screen_name,
            name: response[i].name,
            isVerified: response[i].verified,
            followersCount: response[i].followers_count,
            friendsCount: response[i].friends_count,
            isProtected: response[i].protected,
            accountCreatedDate: response[i].created_at,
            location: response[i].location,
            favoritesCount: response[i].favourites_count,
            statusesCount: response[i].statuses_count
        }
        TwitterUser.findByIdAndUpdate({_id: users[i]._id}, {$set: updatedUser}, {new: true},function(err, userDoc){
            if (err) return cb(err);
            return cb(null, userDoc);
        });
    }
}


