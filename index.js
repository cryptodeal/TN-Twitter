const {getFriendData} = require('./twitter_and_controller')

getFriendData(function(err, result){
    if (err) throw err
    console.log(result)
})