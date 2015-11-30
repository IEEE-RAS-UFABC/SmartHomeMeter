var IDLE = 0;
var PRESSED = 1;
var HOLD = 2;
var RELEASED = 3; 

var NO_KEY = '\0';

function Key(){
	this.kchar = NO_KEY;
	this.kcode = -1;
	this.kstat = IDLE;
	this.stateChanged = false;
    
    this.Key = function() {
        this.kchar = NO_KEY;
        this.kstate = IDLE;
        this.stateChanged = false;
    };

    this.Key = function(userKeyChar) {
        this.kchar = userKeyChar;
        this.kcode = -1;
        this.kstate = IDLE;
        this.stateChanged = false;
    };

    this.key_update = function(userKeyChar, userState, userStatus) {
        this.kchar = userKeyChar;
        this.kstate = userState;
        this.stateChanged = userStatus;
    };
}

module.exports = Key;