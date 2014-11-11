var util  = require('util'),
    EventEmitter = require('events').EventEmitter;
var crypto = require('crypto');

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
       honeypotIp = this.honeypotIp(),
       errThreshold = this.isKarlMode ? 90 : 15; 

   if(rand < 3 && honeypotIp)
      response = {code: 200, url: "/honeypot", honeypot: true, ip: honeypotIp};

   else if(rand < errThreshold)
      response = {code: 500, url: "/bar", ip: this.randomIp()};

   else
      response = {code: 200, url: "/foo", ip: this.randomIp()};

   response.time = new Date().getTime();

   return JSON.stringify(response);
};

LogGenerator.prototype.randomIp = function() {
   return random(1, 255) + '.' + random(1, 255) + '.' + random(1,255) + '.' + random(1, 255);
}

LogGenerator.prototype.devs = [

   {
      name: 'Gordon',
      email: 'gordon@myco.co',
      avatar: 'http://ericmalone.net/dummyimage/100x100/a9a9a9/fff&text=gordon'
   },

   {
      name: 'Julia',
      email: 'julia@myco.com',
      avatar: 'http://ericmalone.net/dummyimage/100x100/a9a9a9/fff&text=julia'
   },

   {
      name: 'Anthony',
      email: 'anthony@myco.com',
      avatar: 'http://ericmalone.net/dummyimage/100x100/a9a9a9/fff&text=anthony'
   },

   {
      name: 'Christopher',
      email: 'christopher@myco.com',
      avatar: 'http://ericmalone.net/dummyimage/100x100/a9a9a9/fff&text=christopher'
   }

];

LogGenerator.prototype.karl = {
   name: 'Karl',
   email: 'karl@myco.com',
   avatar: 'http://ericmalone.net/dummyimage/100x100/a9a9a9/fff&text=karl'
}

LogGenerator.prototype.generateCommit = function(opts) {
  
   if(opts == undefined)
      opts = {};

   // fudging time to a few seconds in the past so we have an element on the page to 
   // attach to. 
   
   var diff = "index 0d8ba84..83a9b15 100644 \n--- a/css/style.css\n+++ b/css/style.css\n@@ -23,6 +23,11 @@ canvas#graph {\npadding: 2px;\n\n\n)\n+#honeypot-list td.ip_clickable {\n\n +   cursor: pointer;\n+  text-decoration: underline;\n}\n";
   var response = {
      sha: this.generateSha(), 
      dev: (opts.isKarl ? this.karl : this.randomDev()), 
      time: Math.floor(new Date().getTime() / 1000) - 5,
      date: new Date().toGMTString(),
      diff: diff,
      message: opts.message || "Look ma! No review"
   };
   
   response = JSON.stringify(response);

   if(opts.emit)
     this.emit('commit', response);
   else
      return response;
};

LogGenerator.prototype.generateCommits = function() {
   setTimeout(function() {

      this.emit('commit', this.generateCommit());

      this.generateCommits();

   }.bind(this), random(45000, 120000));
};

/**
 * sourced from http://stackoverflow.com/questions/9407892/how-to-generate-random-sha1-hash-to-use-as-id-in-node-js
 */
LogGenerator.prototype.generateSha = function() {
   return crypto.createHash('sha1').update(Math.random().toString()).digest('hex').substring(0, 6);
};

LogGenerator.prototype.randomDev = function() {
   return this.devs[random(0,this.devs.length)];
};

LogGenerator.prototype.getCommitFile = function(sha, callback) {

   // load file...
   callback("blah blah blah blah blah");
};

LogGenerator.prototype.isKarlMode = false;


LogGenerator.prototype.setKarlMode = function() {
   this.isKarlMode = true;
   this.generateCommit({emit: true, isKarl: true});
};

LogGenerator.prototype.unsetKarlMode = function() {
   this.isKarlMode = false;
   this.generateCommit({emit: true, message: "Fixed that idiot's mistake. Dammit Karl. >:("});
};
