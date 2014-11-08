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
   
   if(rand < 5)
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
   var ips = ['33.19.199.102', '22.33.44.55', '29.52.119.255', '92.210.59.222'];

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

   }.bind(this), random(10, 300));
};
