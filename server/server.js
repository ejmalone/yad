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

      fs.readFile('/var/www/yad/index.html',// __dirname + '/index.html',
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

   router.register('/karl', router.POST, function(req, res) {
      
      generator.setKarlMode();
      res.end();

   });

   router.register('/karl', router.DELETE, function(req, res) {
      
      var opts = {};
      if(req.body.no_commit)
         opts.no_commit = true;

      generator.unsetKarlMode(opts);
      res.end();

   });


   router.route(req, res);
}

var generator = new LogGenerator();
generator.run();
generator.generateCommits();

io.sockets.on('connection', function (socket) {

   generator.on('log', function(data) {
      socket.emit('log', data);
      // console.log('log', data);
   });

   generator.on('commit', function(data) {
      socket.emit('commit', data);
      console.log('emitting commit', data);
   });

   socket.on('commit_file_request', function(data) {
      generator.getCommit(data, function(details) {
         socket.emit('commit_file', details);
      });
   });

});
