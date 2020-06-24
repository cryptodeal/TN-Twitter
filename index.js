const {addUsers} = require('./twitter_and_controller');
//TODO: 
    //1. Implement strategy for refreshing user info in database at regular intervals
    //2. Implement manual whitelisting of users
    //3. Implement strategy to manually whitelist accounts that:
        //a. are mutual follows (to be safe lol)
        //b. have a large amount of followers (maybe over 1k because that way we don't unfollow any decent accounts?? idk)
    //4. Write unfollow strategy, which unfollows accounts that aren't mutuals (i.e. we follow, but they don't follow back)
    // after X time period of them not following back. Should also change isFollower: true -> isFollower: false, and then
    //set a dateUnfollowed field to current date/time (need to add this field to the usermodel)

//LOW PRIORITY TODO: 
    //1. Add Machine Learning using tensorflow to analyze all user data stored in Twitter Users database collection to
    // identify accounts that are likely to have higher engagement rates, more likely to follow back, etc.


//STRATEGY GOES BELOW:

//Gets ids of followers of @TankieNews, stores to database, gets their account info, and stores to database.
//Then repeats the process for accounts that @TankieNews follows 

//addUsers()

//TESTING BELOW: 