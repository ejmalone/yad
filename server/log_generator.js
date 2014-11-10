var util  = require('util'),
    EventEmitter = require('events').EventEmitter;

function random(low, high)
{
   return Math.floor(Math.random() * (high - low) + low);
}

// rather than using obscure bitwise operator ~
// Don't add Array.prototype.contains() simply because 
// it breaks naive use of for...in loops
function ArrayContains(arr, el) {
   return arr.indexOf(el) != -1;
}


module.exports = LogGenerator;

function LogGenerator() {
   EventEmitter.call(this);
}

util.inherits(LogGenerator, EventEmitter);


// todo: figure out a better composition strategy
LogGenerator.prototype.honeypotIps = [
   '14.208.113.42', // china
   '41.71.128.13',  // nigeria
   '80.71.240.0',   // russia
   '146.134.13.32', // brazil
   '64.65.184.74'   // tacoma
];

LogGenerator.prototype.blockedIps = [];

LogGenerator.prototype.run = function() {

   setTimeout(function() {

      this.emit('log', this.generateLog());

      this.run();

   }.bind(this), random(10, 250));
};

LogGenerator.prototype.blockIp = function(ip) {
   if(!ArrayContains(this.blockedIps, ip))
      this.blockedIps.push(ip);
};

LogGenerator.prototype.unblockIp = function(ip) {
      
   if(ArrayContains(this.blockedIps, ip))
      this.blockedIps.splice(this.blockedIps.indexOf(ip), 1);
};

LogGenerator.prototype.resetIpBlocks = function() {
   this.blockedIps = [];
}

LogGenerator.prototype.honeypotIp = function() {

   var available = [];

   for(var i in this.honeypotIps) {
      if(!this.honeypotIps.hasOwnProperty(i))
         continue;

      var ip = this.honeypotIps[i];

      if(!ArrayContains(this.blockedIps, ip))
         available.push(ip);
   }

   if(!available.length)
      return null;
   
   return available[random(0,available.length)];
};

LogGenerator.prototype.generateLog = function() {
   var response, 
       rand = random(0, 100),
       honeypotIp = this.honeypotIp();

   if(rand < 3 && honeypotIp)
      response = {code: 200, url: "/honeypot", honeypot: true, ip: honeypotIp};

   else if(rand < 15)
      response = {code: 500, url: "/bar", ip: this.randomIp()};

   else
      response = {code: 200, url: "/foo", ip: this.randomIp()};

   response.time = new Date().getTime();

   return JSON.stringify(response);
};


LogGenerator.prototype.randomIp = function() {
   return random(1, 255) + '.' + random(1, 255) + '.' + random(1,255) + '.' + random(1, 255);
}
