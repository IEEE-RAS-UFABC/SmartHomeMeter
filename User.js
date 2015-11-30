function User(id, name, pincode){
    this.id = id;
    this.name = name;
    this.pincode = pincode;
    
    this.getName = function(){
        return name;
    };
    
    this.getPinCode = function(){
        return pincode;
    };
    
    this.getId = function(){
        return id;
    };
}

module.exports = User;