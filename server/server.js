var app = require('http').createServer(handler).listen(3000, '0.0.0.0');
var io = require('socket.io')(app);
var fs = require('fs');
var Feeder = require('./feeder');
var events = require('events');

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var feed = new Feeder();
feed.feed();

io.sockets.on('connection', function (socket) {

  socket.on('my other event', function (data) {
    console.log(data);
  });


   feed.on('data', function(data) {
      socket.emit('request', data);

      console.log('request', data);
   });

});
