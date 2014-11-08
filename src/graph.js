function Graph() {
   jQuery(this.init.bind(this));
}

Graph.consts = {
   // When to repaint the canvas
   REFRESH: 7000,

   HTTP_OK: 200,
   HTTP_ERR: 500
}

Graph.prototype = {

   canvas: null,
   context: null,

   startTime: null, 
   endTime: null,

   /**
    * These buffers store requests coming in from the socket connection
    * @see Graph.prototype.onReceiveData
    */
   oksBuffer: null,
   errsBuffer: null,
   hpBuffer: null,

   buffers: [],

   init: function() {

      this.oksBuffer   = new LineBuffer({color: '#5cb85c', heightOffset: 100, debug: true});
      this.errsBuffer  = new LineBuffer({color: '#d9534f', heightOffset: 50});
      this.honeyBuffer = new LineBuffer({color: '#f0ad4e', heightOffset: 10});

      this.buffers = [this.oksBuffer, this.errsBuffer, this.honeyBuffer];


      this.buildCanvas();
      this.addListeners();
   },

   addListeners: function() {
      jQuery(document).on('vis.data', this.onReceiveData.bind(this));
      
      setInterval(this.onInterval.bind(this), Graph.consts.REFRESH);
   },

   buildCanvas: function() {
      this.canvas = jQuery('<canvas width="50" height="170" id="graph"></canvas>').appendTo(document.body).get(0);
      this.context = this.canvas.getContext('2d');
   },

   draw: function(startTime, endTime) {
      
      for(var i in this.buffers) {
         var buff = this.buffers[i],
             points = buff.queuedForWork;


         this.context.strokeStyle = '#000000';
         this.context.lineWidth = 1;
         this.context.beginPath();
         this.context.moveTo(0, this.canvas.height - buff.heightOffset);
         this.context.lineTo(this.canvas.width, this.canvas.height - buff.heightOffset);
         this.context.stroke();
      
         if(!points)
            continue;
        
         this.context.strokeStyle = buff.color;
         this.context.lineWidth = 3;
         this.context.beginPath();

         this.context.moveTo(0, this.canvas.height - buff.lastY - buff.heightOffset - 10); 

         var lastY;
         for(time = startTime + 1, i=1; time < endTime; ++time, ++i) {
            var count = points[time] || 0;
            this.context.lineTo(i * 10, this.canvas.height - count - buff.heightOffset - 10); 
            
            lastY = count;
         }

         buff.lastY = lastY;

         this.context.stroke();
      }
      
   },

   /**
    * Builds an image from the current state of the canvas and saves to the list of images
    * Referencing https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement.toDataURL
    */
   buildImage: function() {
      var dataUrl = this.canvas.toDataURL();

      var img = jQuery('<img />');
      
      // use an onload to prevent 'FOUC' with unloaded image appended to the list
      img.on('load', function() {
         var li = jQuery('<li></li>').append(img);

         // increase width of the <ul> containing the image slices so that it will scroll nicely horizontally.
         // adding the 200px for the right side padding  a 50px fudge so that the <li>'s will never stack
         jQuery('#graph-images ul').append(li).css('width', jQuery('#graph-images ul li').length * 50 + 200 + 50 + 'px');

         setTimeout(function() {
            jQuery('#graph-images').scrollTo('100%');
         }, 200);
      });

      img.attr('src', dataUrl);

      // reset the canvas
      this.canvas.width = this.canvas.width;
   },

   reset: function() {
      this.startTime = null;
      this.endTime = null;
   },

   /** Event Listeners **/

   onReceiveData: function(e, data) {
      
      if(data.honeypot)
         this.honeyBuffer.push(data);

      else if(data.code == Graph.consts.HTTP_OK)
         this.oksBuffer.push(data);

      else if(data.code == Graph.consts.HTTP_ERR)
         this.errsBuffer.push(data);

      if(!this.startTime) {
         this.startTime = Math.round(data.time / 1000);
         this.endTime = this.startTime + Graph.consts.REFRESH / 1000;  
      }
   },

   onInterval: function() {
       
      // reset buffers before spending time drawing to prevent loss of data
      for(var i in this.buffers)
         this.buffers[i].queueForWork();

      var startTime = this.startTime,
          endTime   = this.endTime;

      this.startTime = null;
      this.endTime = null;

      this.draw(startTime, endTime);

      this.buildImage();
      
   }

}

LineBuffer = function(opts) {

   if(opts) {
      this.color = opts.color;
      this.debug = opts.debug;
      this.heightOffset = opts.heightOffset;
   }

};

LineBuffer.prototype = {
   
   lastPos: null,

   /**
    * Keeps a count of the number of times within a 5 second range that a request was made
    * Value is incremented based on data.time
    * ex: {1415424540: 3, 1415424545: 18, 1415424550: 7}
    *
    * @see LineBuffer#push
    */
   buffer: {},

   queuedForWork: {},
   
   color: '#000000',

   heightOffset: 0,

   debug: false,

   /**
    * Referencing http://stackoverflow.com/questions/4994201/is-object-empty
    */
   queuedIsEmpty: function() {
      for(var i in this.queuedForWork) {
         if(hasOwnProperty.call(this.queuedForWork, i))
            return false;
      }

      return true;
   },

   queueForWork: function() {
      this.queuedForWork = jQuery.extend({}, this.buffer);

      this.buffer = {};
   },

   push: function(data) {

      var time_in_secs = Math.round(data.time / 1000);

      this.buffer[time_in_secs] |= 0;
      this.buffer[time_in_secs]++;
   }

};

graph = new Graph();

