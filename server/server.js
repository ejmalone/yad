var app = require('http').createServer(handler).listen(3000, '0.0.0.0');
var io = require('socket.io')(app);
var fs = require('fs');
var Router = require('./router'),
    router = new Router();
var LogGenerator = require('./log_generator'),
    generator = new LogGenerator;
var events = require('events');

function handler (req, res) {
   
   router.register('/', router.GET, function(req, res) {

      fs.readFile('/var/www/vis/index.html',// __dirname + '/index.html',
         function (err, data) {
            if (err) {
               res.writeHead(500);
               return res.end('Error loading index.html');
            }

            res.end(data);
      });
   });

   var ipblock = {};

   ipblock[router.POST] = function(req, res) {
      
      if(req.body.ip)
         generator.blockIp(req.body.ip);
      else if(req.body.reset)
         generator.resetIpBlocks();

      console.log(generator.blockedIps);
      res.end();
   };
      
   ipblock[router.DELETE] = function(req, res) {
      generator.unblockIp(req.body.ip);

      console.log(generator.blockedIps);
      res.end();
   }

   router.register('/ipblock', ipblock);


   router.route(req, res);
}

var generator = new LogGenerator();
generator.run();

io.sockets.on('connection', function (socket) {

   generator.on('log', function(data) {
      socket.emit('request', data);
      console.log('request', data);
   });

});
