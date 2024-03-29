const mongoose = require('mongoose');
//mongoose.set('debug', true);
const Schema = mongoose.Schema;

const TwitterUser = new Schema ({
    userID: { type: String, required: true, index: true, unique: true },
    handle: { type: String, index: true },
    name: { type: String },
    //Twitter API follower means they follow our account
    isFollower: { type: Boolean, default: false, index: true },
    dateFollowed: { type: Date },
    dateUnfollowed: { type: Date },
    //Twitter API friend means our account follows their's
    isFriend: { type: Boolean, default: false, index: true },
    dateFriended: { type: Date },
    dateUnfriended: { type: Date },
    isWhitelisted: { type: Boolean, default: false, index: true },
    isVerified: { type: Boolean, default: false },
    followersCount: { type: Number },
    friendsCount: { type: Number },
    isProtected: { type: Boolean },
    description: { type: String },
    accountCreatedDate: { type: Date },
    location: { type: String },
    favoritesCount: { type: Number },
    statusesCount: { type: Number }
});

TwitterUser.pre(['updateOne', 'findOneAndUpdate'], function(next){
    if (this._update.$set.isVerified == true){
        this._update.$set.isWhitelisted = true;
        return next();
    }
    return next();
    
});

module.exports = mongoose.model('TwitterUser', TwitterUser)
