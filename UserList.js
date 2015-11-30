var User = require('./User');

function UserList() {
    var users = [];
    this.getList = function(){
        return users;  
    };
    this.add = function(user){   
        if (!(user instanceof User)) throw "is not a user";
        users.push(user);
    };

    this.findById = function(id){
        if (typeof(id) !== 'number' && !(pincode instanceof Number)) throw "is not a number";
        if (users.length === 0) throw "is empty";
        for(var i = 0; i < users.length; i++){
            var user = users[i];
            if (!(user instanceof User)) throw "is not a user";
            if (user.getId() === id)
                return user;
        }
        return null;
    };

    this.findByName = function(name){
        if (typeof(name) !== 'string' && !(pincode instanceof String)) throw "is not a string";
        if (users.length === 0) throw "is empty";
        for(var i = 0; i < users.length; i++){
            var user = users[i];
            if (!(user instanceof User)) throw "is not a user";
            if (user.getName() === name)
                return user;
        }
        return null;
    };

    this.findByPinCode = function(pincode){
        if (typeof(pincode) !== 'string' && !(pincode instanceof String)) throw "is not a string";
        if (users.length === 0) throw "is empty";
        for(var i = 0; i < users.length; i++){
            var user = users[i];
            if (!(user instanceof User)) throw "is not a user";
            if (user.getPinCode() === pincode)
                return user;
        }
        return null;
    };
}

module.exports = UserList;