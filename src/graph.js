function Graph() {
   jQuery(this.init.bind(this));
}

Graph.consts = {
   // When to repaint the canvas
   REFRESH: 7000,

   HTTP_OK: 200,
   HTTP_ERR: 500,

   ERR_MSG: "Warning - there are usually large number of errors!"
}

Graph.prototype = {

   canvas: null,
   context: null,

   isScrolling: true,

   /**
    * The starting and ending times (in seconds) for which the graph making its current
    * logging pass.
    */
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

   unusualErrorCount: 0,
   errorsLimitForNotification: 2,

   init: function() {

      this.oksBuffer   = new LineBuffer({color: '#5cb85c', heightOffset: 100, countId: '#count-oks'});
      this.errsBuffer  = new LineBuffer({color: '#d9534f', heightOffset: 50, countId: '#count-5xx'});
      this.honeyBuffer = new LineBuffer({color: '#f0ad4e', heightOffset: 10, countId: '#count-pots'});

      this.buffers = [this.oksBuffer, this.errsBuffer, this.honeyBuffer];


      this.buildCanvas();
      this.addListeners();

      jQuery('#scroll-with-graph').prop('checked', true);

      // get notifications ready
      if(window.Notification && window.Notification.permission != 'granted')
         Notification.requestPermission();
   },

   addListeners: function() {
      jQuery(document).on('vis.data', this.onReceiveData.bind(this));
      jQuery('#graph-images').on('stop', this.onStopRequested.bind(this));
      jQuery('#scroll-with-graph').on('change', this.onScrollClick.bind(this));
      
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
         
         buff.showRequestTotal();

         buff.lastY = lastY;

         this.context.stroke();
      }
      
   },

   /**
    * Builds an image from the current state of the canvas and saves to the list of images
    * Referencing https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement.toDataURL
    */
   buildImage: function(startTime, endTime) {

      var dataUrl = this.canvas.toDataURL(),
          img     = jQuery('<img />');
      
      // use an onload to prevent 'FOUC' with unloaded image appended to the list
      img.on('load', function() {
         var li = jQuery('<li></li>').attr({'data-start': startTime, 'data-end': endTime}).append(img);

         // increase width of the <ul> containing the image slices so that it will scroll nicely horizontally.
         // adding the 200px for the right side padding  a 50px fudge so that the <li>'s will never stack
         li.insertBefore('#graph-counts');

         jQuery('#graph-images ul').css('width', jQuery('#graph-images ul li').length * 50 + 200 + 50 + 'px');
         
         if(this.isScrolling) {
            setTimeout(function() {
               jQuery('#graph-images').scrollTo('100%');
            }, 200);
         }
      }.bind(this));

      img.attr('src', dataUrl);

   },

   notifyIfUnusualErrors: function() {

      if(this.errsBuffer.queuedRequestCount() > this.oksBuffer.queuedRequestCount()) {
      
         ++this.sigErrorsCount;

          // alert then reset the errors count for the next time
         if(this.sigErrorsCount >= this.errorsLimitForNotification) {
            this.notifyErrorSituation();
            this.sigErrorsCount = 0; 
         }
      }
      else
         this.sigErrorsCount = 0;
   },

   /**
    * Play audio and notify the user
    * via https://developer.mozilla.org/en-US/docs/Web/API/notification
    */
   notifyErrorSituation: function() {
      
      if(window.Notification && window.Notification.permission == 'granted')
         new Notification(Graph.consts.ERR_MSG);
      else 
         alert(Graph.consts.ERR_MSG);

      var alert_notification = document.getElementById('alert_notification');

      if(alert_notification.play)
         alert_notification.play();
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

   onStopRequested: function(e) {
      this.isScrolling = false;
      jQuery('#scroll-with-graph').prop('checked', false);
   },

   onScrollClick: function(e) {
      this.isScrolling = jQuery(e.target).prop('checked');
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

      this.notifyIfUnusualErrors();

      this.buildImage(startTime, endTime);
      
      // reset the canvas
      this.canvas.width = this.canvas.width;
   }

}

LineBuffer = function(opts) {

   if(opts) {
      this.color = opts.color;
      this.debug = opts.debug;
      this.heightOffset = opts.heightOffset;
      this.countId = opts.countId;
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

   coundId: '',

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

   queuedRequestCount: function() {
      
      var total = 0;

      for(i in this.queuedForWork) {
         total += this.queuedForWork[i];
      }

      return total;
   },

   showRequestTotal: function() {
      
      if(this.countId)
         jQuery(this.countId).text(this.queuedRequestCount());
   },

   push: function(data) {

      var time_in_secs = Math.round(data.time / 1000);

      this.buffer[time_in_secs] |= 0;
      this.buffer[time_in_secs]++;
   }

};

graph = new Graph();

