/**
 * Dumb little router built as a test. Doesn't support serving directly from the filesystem
 */

var url = require('url');
var qs  = require('querystring');

module.exports = Router;

function Router() {}

Router.prototype = {
  
   GET: 'GET',
   POST: 'POST',
   PUT: 'PUT',
   DELETE: 'DELETE',

   routes: {},

   /**
    * Possible arguments:
    *    path, method, callback
    *    path, method to callback hash
    */
   register: function(path) {
     
      var methodHash = {};

      // ('/', 'GET', function() {})
      if(arguments.length == 3)
         methodHash[arguments[1]] = arguments[2];

      // ('/', { 'GET': function() {}, 'POST': function() {} })
      else
         methodHash = arguments[1];

      if(!this.routes[path])
         this.routes[path] = {};

      for(var method in methodHash) {
         console.log('Router: registering', path, method);
         this.routes[path][method] = methodHash[method]; 
      }
   },

   route: function(req, res) {

      // CORS capability for ajax requests
      // This could be avoided if all the talking was over the websocket
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

      var execute_route = function(req, res) {
         var path = url.parse(req.url).pathname;
         var method = this.getMethod(req);

         console.log('Router: routing', path, method);
         
         if(!this.routes[path] || !this.routes[path][method]) {
            this.fourOhFour(res, path, method);
            return;
         }

         this.routes[path][method](req, res);

      }.bind(this, req, res);

      // getting post data via http://stackoverflow.com/questions/4295782/how-do-you-extract-post-data-in-node-js
      if (req.method == this.POST) {

        var body = '';
        req.on('data', function (data) {
            body += data;
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6) { 
               // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
               req.connection.destroy();
            }
         });

         req.on('end', function () {
            var post = qs.parse(body);
            req.body = post;
            execute_route();
         });
      }
      else
         execute_route();
     

   },

   fourOhFour: function(res, path, method) {
      console.log('Router: response', path, 404);

      res.writeHead(404);
      res.end("Router: route not found for " + method + " " + path);
   },

   getMethod: function(req) {
      if(req.body && req.body._method)
         return req.body._method;
         
      var parts = url.parse(req.url, true);
      if(parts.query && parts.query._method)
         return parts.query._method;

      return req.method;
   }
}
