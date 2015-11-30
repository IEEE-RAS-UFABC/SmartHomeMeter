var User = require('./User');
function Consumption(user, startDate, endDate, liters){
    if (!(user instanceof User)) throw "is not a user";
        this.userName = user.getName();
        this.userId = user.getId();
    if (!(startDate instanceof Date)) throw "is not a date";
        this.startDate = startDate.getDate() + '/' + startDate.getMonth() + '/' + startDate.getFullYear();
        this.startHour = startDate.getHours() + ':' + startDate.getMinutes() + ':' + startDate.getSeconds();
    if (!(endDate instanceof Date)) throw "is not a date";
        this.endDate = endDate.getDate() + '/' + endDate.getMonth() + '/' + endDate.getFullYear();
        this.endHour = endDate.getHours() + ':' + endDate.getMinutes() + ':' + endDate.getSeconds();
    if (typeof(liters) !== 'number' &&  !(liters instanceof Number)) throw "is not a number";
        this.liters = liters;
    this.id = ++Consumption.conscounter;
    
    this.toString = function(){
        var s = this.id + ';' + this.startDate + ';' + this.startHour + ';' + this.endDate + ';' + this.endHour + ';' + this.userId + ';' + this.userName + ';' + this.liters + '\n';
        return s;
    };
}

Consumption.conscounter = 0;

module.exports = Consumption;