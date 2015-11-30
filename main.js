var fs = require("fs");
var mraa = require('mraa');    
var User = require('./User');
var UserList = require('./UserList');
var Consumption = require('./Consumption');
var BlockerActuator = require('./BlockerActuator');
var WaterFlowSensor = require('jsupm_grovewfs');
var LCD = require('jsupm_i2clcd');
var Key = require('./Key');
var KeyPad = require('./KeyPad');

var blockerActuator = new BlockerActuator(4, true);
var waterFlowSensor = new WaterFlowSensor.GroveWFS(3);
var display = new LCD.Jhd1313m1(0, 0x3E, 0x62);

var keys = ['1', '2', '3', 'A',
            '4', '5', '6', 'B',
            '7', '8', '9', 'C',
            '*', '0', '#', 'D'];

var colPins = [9, 8, 7, 6]; //connect to the column pinouts of the keypad
var rowPins = [13, 12, 11, 10]; //connect to the row pinouts of the keypad

var keyPad = new KeyPad(keys, rowPins, colPins, 4, 4);

var user = new User(-1, '', '');
var users = new UserList();

users.add(new User(1, 'Carolina', "12345"));
users.add(new User(2, 'Debora', "23456"));
users.add(new User(3, 'Marcelo', "34567"));
users.add(new User(4, 'Marcio', "45678"));
users.add(new User(5, 'Pedro', "56789"));

var consumptions = [];
consumptions.push('ID;Start Date;Start Hour;End Date;End Hour;User ID;User Name;Liters\n');

console.log("Going to write into existing file");

var startDate;
var endDate;
var liters = 0.0; 
var maxLiters = 1.0;
var pulsesPerLiters = 380;

var STOPED = 0;
var AVAILABLE = 1;
var IN_USE = 2;
var FEEDBACK = 3;
var systemMode = AVAILABLE;
console.log("Mode: Available");

var pincode = String("");

var mainInterval = setInterval(function(){
    
    var key = keyPad.getKey();
    if (key !== '\0'){
        console.log('Typed: ' + key);
        switch(systemMode){
            case AVAILABLE:
                if (pincode.length < 5){
                    pincode += key;
                    display.setCursor(1, 4 + pincode.length);
                    display.write(key);
                }
            break;
                
            case IN_USE: 
                if (key === 'D'){
                    systemMode = STOPED;
                    display.clear();
                    blockerActuator.block();
                    waterFlowSensor.clearFlowCounter();
                    waterFlowSensor.stopFlowCounter();

                    display.setCursor(0,0);
                    display.write('You consumed:');
                    display.setCursor(1,0);
                    display.write(liters + ' Liters');

                    endDate = new Date();
                    var c = new Consumption(user, startDate, endDate, liters);
                    consumptions.push(c.toString());
                    console.log(consumptions);
                    saveConsumptions();

                    user = null;
                    startDate = null;
                    endDate = null;
                    liters = 0;
                    pinScren();
                    console.log("Mode: Available");
                }
            break;
        }
    }  
      
    switch(systemMode){
        case AVAILABLE: 
            if (pincode.length >= 5){
                systemMode = STOPED;
                var u = users.findByPinCode(pincode);
                pincode = '';
                if (u !== null){
                    user = u;
                    blockerActuator.unblock();
                    waterFlowSensor.clearFlowCounter();
                    waterFlowSensor.startFlowCounter();
                    startDate = new Date();
                    welcomeScreen();
                }else{
                    invalidUserScreen();
                }
            }
        break;
            
        case IN_USE:
            liters = waterFlowSensor.flowCounter()/pulsesPerLiters;
            liters = parseFloat(liters.toFixed(2));
            var cd = Math.min(Math.floor(liters*255/maxLiters), 255);
            console.log(cd);
            display.setColor(cd, 255 - cd, 0);
            display.setCursor(1,9);
            display.write(liters + 'L');
        break;
            
        case STOPED:
        break;
    }
        
}, 100);

var setup = function(){
    blockerActuator.block();
    waterFlowSensor.clearFlowCounter();
    startScreen();
};

var startScreen = function(){
    systemMode = STOPED;
    display.clear();
    display.setColor(200, 0, 200);
    display.setCursor(0, 0);    
    display.write('Smart Home Meter');
    display.setCursor(1, 0);    
    display.write('Initializing...');
    pinScren();
};

var pinScren = function(){
    setTimeout(function(){
        display.clear();
        display.setColor(200, 0, 200);
        display.setCursor(0, 0);    
        display.write('Smart Home Meter');
        display.setCursor(1, 0);    
        display.write('Pin:');
        systemMode = AVAILABLE;
    }, 2000);
}

var welcomeScreen = function(){
    display.clear();
    display.setColor(0, 255, 0);
    display.setCursor(0, 0);    
    display.write('Welcome,');
    display.setCursor(1, 0);    
    display.write(user.getName());
    
    setTimeout(function(){
        display.clear();
        display.setCursor(0, 0);  
        display.write('Smart Home Meter');
        display.setCursor(1, 0);    
        display.write('Consumed:');
        console.log("Mode: In use");
        systemMode = IN_USE;
    }, 2000);
};

var invalidUserScreen = function(){
    display.clear();
    display.setColor(200, 0, 0);
    display.setCursor(0, 0);    
    display.write('Invalid Pin Code');
    display.setCursor(1, 0);    
    display.write(' Check your pin ');
    
    setTimeout(function(){
        pinScren();
    }, 2000);
};

var saveConsumptions = function(){
    var aux = '';
    for (var i = 0; i < consumptions.length; i++)
        aux += consumptions[i];
    fs.writeFile('consumptions.csv', aux,  function(err) {
       if (err) {
           return console.error(err);
       }
    fs.readFile('consumptions.csv', function (err, data) {
        if (err) {
            return console.error(err);
        }
        console.log("Asynchronous read: " + data.toString());
    });
    });
};
setup();
