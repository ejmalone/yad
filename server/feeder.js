var util  = require('util'),
    EventEmitter = require('events').EventEmitter;

function random(low, high)
{
   return Math.floor(Math.random() * (high - low) + low);
}

function output()
{
   var response, 
       rand = random(0, 100);
   
   if(rand < 3)
      response = {code: 200, url: "/bar", honeypot: true, ip: honeypot_ip()};

   else if(rand < 90)
      response = {code: 200, url: "/foo", ip: ip()};

   else
      response = {code: 500, url: "/bar", ip: ip()};

   response.time = new Date().getTime();

   return JSON.stringify(response);
}

function ip()
{
   return random(1, 255) + '.' + random(1, 255) + '.' + random(1,255) + '.' + random(1, 255);
}

function honeypot_ip()
{
   var ips = [
      '14.208.113.42', // china
      '41.71.128.13',  // nigeria
      '80.71.240.0',   // russia
      '146.134.13.32', // brazil
      '66.150.14.181' // tacoma
   ];

   return ips[random(0,ips.length)];
}

module.exports = Feeder;

function Feeder() {
   EventEmitter.call(this);
}

util.inherits(Feeder, EventEmitter);


Feeder.prototype.feed = function() {

   setTimeout(function() {
   
      var _output = output();

      this.emit('data', _output);

      this.feed();

   }.bind(this), random(10, 250));
};
