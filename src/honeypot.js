var HoneypotList = React.createClass({
   
   map: null,

   createMap: function() {
      
      var mapOptions = {
         center: { lat: 31.0664861, lng: -161.6455492},
         zoom: 2
      };

      this.map = new google.maps.Map(document.getElementById('map'), mapOptions);
   },
   
   lookupOrMarkerForIp: function(ip) {
      
      if(this.state.data[ip].latitude)
         this.markerIp(ip);      

      else if(!this.state.data[ip].latitude && !this.state.data[ip].ip_error)
         this.lookupIp(ip);

   },

   markerIp: function(ip) {

      var marker = new google.maps.Marker({
         position: new google.maps.LatLng(this.state.data[ip].latitude, this.state.data[ip].longitude),
         map: this.map,
         title: String(this.state.data[ip].count)
      });

   },

   lookupIp: function(ip) {
      console.log('will lookup', ip);
      window.lookup_ip(ip, function(data) {
         
         this.state.data[ip].latitude  = data.latitude;
         this.state.data[ip].longitude = data.longitude;
         this.state.data[ip].country_code = data.country_code;
         this.state.data[ip].country_name = data.country_name;

         this.setState(this.state);

         this.markerIp(ip);

      }.bind(this), function(data) {
         
         this.state.data[ip].ip_error = true;

      }.bind(this));
   },


   getInitialState: function() {
      return {data: {}};
   },

   componentDidMount: function() {
      
      this.createMap();

      jQuery(document).on('vis.data', function(e, data) {

         if(!data.honeypot)
            return;
         
         if(!this.state.data[data.ip])
            this.state.data[data.ip] = {ip: data.ip, count: 1};
         else
            this.state.data[data.ip].count++;
        
         this.lookupOrMarkerForIp(data.ip);

         
         this.setState({data: this.state.data});

      }.bind(this));
   },


   render: function() {
      var createItem = function(data) {
         return <tr key={data.ip}><td>{data.ip}</td><td>{data.count}</td><td>{data.country_name}</td><td><input type="button" value="Block" /></td></tr>
      };
     
      var data = [];
      for(var i in this.state.data)
         data.push(this.state.data[i]);
      
      data.sort(this.sortByCountMax);

      return <table className="table"><tr><th>IP</th><th>Requests</th><th>Country</th></tr>{data.map(createItem)}</table>;
   },

   sortByCountMax: function(a, b) {
      if(b.count < a.count)
         return -1;
      else if(b.count > a.count)
         return 1;
      else
         return 0;
   }
});

$(function() {
   React.render(<HoneypotList />, document.getElementById('honeypot-list'));
})



/**
 * Simple ip geocoder based on work from http://lab.abhinayrathore.com/ipmapper/
 * extracting out the relevant bits for our own purposes
 */ 
function lookup_ip(ip, callback, failure) {
  
   callback = callback || function() {};
   failure  = failure || function() {};

   var url = "http://freegeoip.net/json/" + ip + "?callback=?";

   jQuery.getJSON(url, function(data) {
      
      if(jQuery.trim(data.latitude) != '' && data.latitude != '0' && !isNaN(data.latitude)) {

         // data includes ip, country_code, latitude, longitude
         callback(data);

      }
      else {

         console.error("IP lookup failed for " . ip);
         failure({ip: ip, success: false});

      }
   });

};
