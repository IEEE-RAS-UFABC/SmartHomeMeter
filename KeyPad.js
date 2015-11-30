var mraa = require('mraa');
var Key = require('./key');

var IDLE = 0;
var PRESSED = 1;
var HOLD = 2;
var RELEASED = 3; 

var NO_KEY = '\0';

function KeyPad(userKeymap, row, col, numRows, numCols){
    var OPEN = 0;
    var CLOSED = 1;
    var KeypadEvent = '';

    var LIST_MAX = 10;		// Max number of keys on the active list.
    var MAPSIZE = 10;		// MAPSIZE is the number of rows (times 16 columns)
    
    var bitMap = [];	// 10 row x 16 column array of bits. Except Due which has 32 columns.
	var key = [];
    for(var i = 0; i < LIST_MAX; i++)
        key[i] = new Key();
    
	var holdTimer;
    
    // <<constructor>> Allows custom keymap, pin configuration, and keypad sizes.
	var rows = numRows;
	var columns = numCols;
    var rowPinsNums = [];
    rowPinsNums = row;
	var columnPinsNums = [];
    columnPinsNums = col;
    
    var rowPins = [];
    for (i = 0; i < rows; i++)
        rowPins[i] = new mraa.Gpio(rowPinsNums[i]);
    
    var columnPins = []; 
    for (i = 0; i < columns; i++)
        columnPins[i] = new mraa.Gpio(columnPinsNums[i]);
    
    var keymap;
    
	var keypadEventListener = 0;
	var startTime = 0;
	var single_key = false;
    
	var debounceTime;
	var holdTime;
    
    
    
    // Let the user define a keymap - assume the same row/column count as defined in constructor
    this.begin = function(userKeymap){
        keymap = userKeymap;
    };
    
    // Returns a single key only. Retained for backwards compatibility.
    this.getKey = function() {
        single_key = true;
        if (this.getKeys() && key[0].stateChanged && (key[0].kstate === PRESSED))
            return key[0].kchar;
        single_key = false;
        return NO_KEY;
    };
    
    // Populate the key list.
    this.getKeys = function() {
        var keyActivity = false;

        // Limit how often the keypad is scanned. This makes the loop() run 10 times as fast.
        if ( (Date.now() - startTime) > debounceTime ) {
            scanKeys();
            keyActivity = updateList();
            startTime = Date.now();
        }
        return keyActivity;
    };
    
    //OK
    // Private : Hardware scan
    var scanKeys = function() {
        // Re-intialize the row pins. Allows sharing these pins with other hardware.
        for (var r = 0; r < rows; r++) {
            rowPins[r].dir(mraa.DIR_IN);
            rowPins[r].mode(mraa.MODE_PULLUP);
        }
        // bitMap stores ALL the keys that are being pressed.
        for (var c = 0; c < columns; c++) {
            columnPins[c].dir(mraa.DIR_OUT);
            columnPins[c].write(0);	// Begin column pulse output.
            for (r = 0; r < rows; r++) {
                bitMap[r] = bitWrite(bitMap[r], c, !rowPins[r].read());  // keypress is active low so invert to high.
            }
            // Set pin to high impedance input. Effectively ends column pulse.
            columnPins[c].write(1);
            columnPins[c].mode(mraa.DIR_IN);
        }
    };
    
    var updateList = function() {
        var anyActivity = false;

        // Delete any IDLE keys
        for (var i = 0; i < LIST_MAX; i++) {
            if (key[i].kstate === IDLE) {
                key[i].kchar = NO_KEY;
                key[i].kcode = -1;
                key[i].stateChanged = false;
            }
        }

        // Add new keys to empty slots in the key list.
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < columns; c++) {
                var button = bitRead(bitMap[r], c);
                var keyChar = keymap[(r * columns + c)];
                var keyCode = (r * columns + c);
                var idx = findInListCode(keyCode);
                // Key is already on the list so set its next state.
                if (idx > -1)
                    nextKeyState(idx, button);
                
                // Key is NOT on the list so add it.
                if ((idx === -1) && button) {
                    for (i = 0; i < LIST_MAX; i++) {
                        if (key[i].kchar === NO_KEY) {		// Find an empty slot or don't add key to list.
                            key[i].kchar = keyChar;
                            key[i].kcode = keyCode;
                            key[i].kstate = IDLE;		// Keys NOT on the list have an initial state of IDLE.
                            nextKeyState (i, button);
                            break;	// Don't fill all the empty slots with the same key.
                        }
                    }
                }
            }
        }

        // Report if the user changed the state of any key.
        for (i = 0; i < LIST_MAX; i++) {
            if (key[i].stateChanged) anyActivity = true;
        }
        return anyActivity;
    };
    
    // Private
    // This function is a state machine but is also used for debouncing the keys.
    var nextKeyState = function(idx, button) {
        key[idx].stateChanged = false;

        switch (key[idx].kstate) {
            case IDLE:
                if (button === CLOSED) {
                    transitionTo (idx, PRESSED);
                    holdTimer = Date.now(); 
                }		// Get ready for next HOLD state.
            break;
                
            case PRESSED:
                if ((Date.now() - holdTimer) > holdTime)	// Waiting for a key HOLD...
                    transitionTo(idx, HOLD);
                else if (button === OPEN)				// or for a key to be RELEASED.
                    transitionTo(idx, RELEASED);
            break;
                
            case HOLD:
                if (button === OPEN)
                    transitionTo(idx, RELEASED);
            break;
                
            case RELEASED:
                transitionTo(idx, IDLE);
            break;
        }
    };
    
    // New in 2.1
    var isPressed = function(keyChar) {
        for (var i = 0; i < LIST_MAX; i++) {
            if ( key[i].kchar === keyChar ) {
                if ( (key[i].kstate === PRESSED) && key[i].stateChanged )
                    return true;
            }
        }
        return false;	// Not pressed.
    };
    
    // Search by character for a key in the list of active keys.
    // Returns -1 if not found or the index into the list of active keys.
   var findInListChar = function (keyChar) {
        for (var i = 0; i < LIST_MAX; i++) {
            if (key[i].kchar === keyChar) {
                return i;
            }
        }
        return -1;
    };
   
   
    // Search by code for a key in the list of active keys.
    // Returns -1 if not found or the index into the list of active keys.
    var findInListCode = function(keyCode) {
        for (var i = 0; i < LIST_MAX; i++) {
            if (key[i].kcode === keyCode) {
                return i;
            }
        }
        return -1;
    };
    
    // New in 2.0
    var waitForKey = function() {
        var waitKey = NO_KEY;
        while( (waitKey = this.getKey()) === NO_KEY );	// Block everything while waiting for a keypress.
        return waitKey;
    };
    
    
    // Backwards compatibility function.
    var getState = function() {
        return key[0].kstate;
    };
    
    
    // The end user can test for any changes in state before deciding
    // if any variables, etc. needs to be updated in their code.
    var keyStateChanged = function() {
        return key[0].stateChanged;
    };
    

    // Minimum debounceTime is 1 mS. Any lower *will* slow down the loop().
    var setDebounceTime = function(debounce) {
        debounce < 1 ? debounceTime = 1 : debounceTime = debounce;
    };

    var setHoldTime = function(hold) {
        holdTime = hold;
    };

    var addEventListener = function(listener){
        keypadEventListener = listener;
    };
    
    
    var transitionTo = function(idx, nextState) {
        key[idx].kstate = nextState;
        key[idx].stateChanged = true;

        // Sketch used the getKey() function.
        // Calls keypadEventListener only when the first key in slot 0 changes state.
//        if (single_key)  {
//            if ((keypadEventListener != null) && (idx === 0))
//                keypadEventListener(key[0].kchar);
//        }
//        // Sketch used the getKeys() function.
//        // Calls keypadEventListener on any key that changes state.
//        else {
//            if (keypadEventListener != null) 
//                keypadEventListener(key[idx].kchar);   
//        }
    };
    
    //ok
    var bitWrite = function(value, bit, bitvalue){
        if (bitvalue)
            return bitSet(value, bit)
        return bitClear(value, bit);
    };

    //ok
    var bitRead = function(value, bit){
        return  (value >> bit) & 0x01;
    };

    //ok
    var bitSet = function(value, bit){
        return value |= (1 << (bit));
    };

    //ok
    var bitClear = function(value, bit){
        return value &= ~(1 << bit);
    };
    
	this.begin(userKeymap);
	setDebounceTime(10);
	setHoldTime(100);
}

module.exports = KeyPad;