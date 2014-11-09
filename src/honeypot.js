var HoneypotTable = React.createClass({
   
   map: null,

   createMap: function() {
      
      var mapOptions = {
         center: { lat: 31.0664861, lng: -161.6455492},
         zoom: 2
      };

      this.map = new google.maps.Map(document.getElementById('map'), mapOptions);
   },
   
   setMarker: function(ip) {
     
      var ipdata = this.state.data[ip];

      if(!ipdata.latitude)
         return;

      if(!this.state.data[ip].latLng) {
         this.state.data[ip].latLng = new google.maps.LatLng(ipdata.latitude, ipdata.longitude);
      }

      var multiplier = ipdata.count >= 50 ? 50 : ipdata.count;

      var circleOptions = {
         strokeColor: '#FF0000',
         strokeOpacity: 0.8,
         strokeWeight: 2,
         fillColor: '#FF0000',
         fillOpacity: 0.35,
         map: this.map,
         center: this.state.data[ip].latLng,
         radius: multiplier * 10000
      };

      if(!this.state.data[ip].marker) 
         this.state.data[ip].marker = new google.maps.Circle(circleOptions);

      else
         this.state.data[ip].marker.setOptions(circleOptions);

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

         this.setMarker(data.ip);
        
         this.setState({data: this.state.data});

      }.bind(this));

      jQuery(document).on('vis.ip_lookup', function(e, data) {
         
         this.state.data[data.ip].latitude = data.latitude;
         this.state.data[data.ip].longitude = data.longitude;
         this.state.data[data.ip].country_name = data.country_name;

         this.setMarker(data.ip);

         this.setState({data: this.state.data});

      }.bind(this));
   },


   render: function() {
      
      // create an array of objects so they can be sorted
      var data = [];

      for(var i in this.state.data)
         data.push(this.state.data[i]);
      
      data.sort(this.sortByCountMax);

      return (
         <table className="table">

            <tr><th>IP</th><th>Requests</th><th>Country</th></tr>

            {data.map(function(entry) {
               return <HoneypotListItem key={entry.ip} ip={entry.ip} data={entry} />;
            })}

         </table>
      );
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


/**
 * I would have liked to lookup ip and set the state here along with the marker, but 
 * the HoneypotTable would not pass the map object (not the DOM node, but the actual object) via prop,
 * nor was I having any luck referencing the map with window.honeypot_map.
 *
 * However by doing the ip lookup here, it prevents multiple lookups since it's only done once on 
 * component load, and the data flow does pass, as React wants, from parent to child.
 */ 
var HoneypotListItem = React.createClass({
   
   lookupIp: function() {

      window.lookup_ip(this.props.ip, function(data) {

         jQuery(document).trigger('vis.ip_lookup', data);

      }.bind(this), function(data) {

      }.bind(this));
   },

   componentDidMount: function() {
      
      if(this.props.data && !this.props.data.country_name)
         this.lookupIp();
   },
   
   render: function() {

      return (
         <tr>
            <td>{this.props.ip}</td>
            <td>{this.props.data.count}</td>
            <td>{this.props.data.country_name}</td>
            <td><input type="button" value="Block" /></td>
         </tr>
      );
   }

});

$(function() {
   React.render(<HoneypotTable />, document.getElementById('honeypot-list'));
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
