function Graph() {
   jQuery(this.init.bind(this));
}

Graph.consts = {
   // When to repaint the canvas
   REFRESH: 10000,

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

      this.oksBuffer   = new LineBuffer({color: '#00ff00', debug: true});
      this.errsBuffer  = new LineBuffer({color: '#ff0000'});
      this.honeyBuffer = new LineBuffer({color: '#ffa500'});

      this.buffers = [this.oksBuffer, this.errsBuffer, this.honeyBuffer];


      this.buildCanvas();
      this.addListeners();
   },

   addListeners: function() {
      jQuery(document).on('vis.data', this.onReceiveData.bind(this));
      
      setInterval(this.onInterval.bind(this), Graph.consts.REFRESH);
   },

   buildCanvas: function() {
      this.canvas = document.getElementById('graph');
      this.context = this.canvas.getContext('2d');
   },

   draw: function(startTime, endTime) {
      
      for(var i in this.buffers) {
         var buff = this.buffers[i],
             points = buff.queuedForWork;
      
         if(!points)
            continue;
        
         this.context.strokeStyle = buff.color;
         this.context.lineWidth = 3;
         this.context.beginPath();

         this.context.moveTo(0, this.canvas.height - buff.lastY); 

         var lastY;
         for(time = startTime + 5, i=1; time < endTime; time +=5, ++i) {
            var count = points[time] || 0;
            this.context.lineTo(i * 50, this.canvas.height - count) 
            
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

      var img = jQuery('<img />').attr('src', dataUrl);

      jQuery('#graph-images').append(img);
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
         this.startTime = Math.floor(data.time / 1000);
         this.startTime = this.startTime - (this.startTime % 5);

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

   debug: false,

   queuedIsEmpty: function() {
      return !this.queuedForWork.length;
   },

   queueForWork: function() {
      this.queuedForWork = this.buffer;
      this.buffer = {};
   },

   push: function(data) {

      var time_in_secs = Math.floor(data.time / 1000);
      var time_base = time_in_secs - (time_in_secs % 5);

      this.buffer[time_base] |= 0;
      this.buffer[time_base]++;
   }

};

graph = new Graph();

