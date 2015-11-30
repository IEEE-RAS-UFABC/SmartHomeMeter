var mraa = require('mraa');
function BlockingActuator(pin, nf){
    var output = new mraa.Gpio(pin);
    output.dir(mraa.DIR_OUT);
    
    this.block = function(){
        if(nf)
            output.write(0);
        else    
            output.write(1);
    };
    
    this.unblock = function(){
        if(nf)
            output.write(1);
        else    
            output.write(0);
    };
    
}

module.exports = BlockingActuator;