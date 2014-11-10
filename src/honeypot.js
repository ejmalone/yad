var HoneypotTable = React.createClass({
   
   map: null,

   ajaxHost: '//' + location.host + ':3000',

   createMap: function() {
      
      var mapOptions = {
         center: { lat: 31.0664861, lng: -161.6455492},
         zoom: 2
      };

      this.map = new google.maps.Map(document.getElementById('map'), mapOptions);
   },

   onNewVisData: function(e, data) {

      if(!data.honeypot)
         return;

      if(!data.ip)
      {
         console.error('weird data', data);
      }
      
      if(!this.state.data[data.ip]) {
         this.state.data[data.ip] = {ip: data.ip, count: 1, latitude: null, longitude: null, blocked: false};
         this.lookupIp(data.ip);
      }
      else
         this.state.data[data.ip].count++;

      this.setState({data: this.state.data});

   },

   /**
    * Simple ip geocoder based on work from http://lab.abhinayrathore.com/ipmapper/
    * extracting out the relevant bits for our own purposes
    */ 
   lookupIp: function(ip) {
        
      var url = "http://freegeoip.net/json/" + ip + "?callback=?";

      // console.log('looking up', ip);

      jQuery.getJSON(url, function(data) {
         
         if(jQuery.trim(data.latitude) != '' && data.latitude != '0' && !isNaN(data.latitude)) {

            this.state.data[data.ip].latitude = data.latitude;
            this.state.data[data.ip].longitude = data.longitude;
            this.state.data[data.ip].country_name = data.country_name;

            this.setState({data: this.state.data});
         }
         else {

            console.error("IP lookup failed for ", ip);

         }
      }.bind(this));
   },

   onBlockClickToggle: function(ip) {
      
      var postdata = {ip: ip};

      if(!this.state.data[ip].blocked) {
         this.state.data[ip].blocked = true;
      }
      else {
         this.state.data[ip].blocked = false;
         postdata._method = 'DELETE';
      }
      
      jQuery.post(this.ajaxHost + '/ipblock', postdata, function() {
         this.setState({data: this.state.data});
      }.bind(this));
      
   },

   onIpClick: function(ip) {
      var marker = this.state.data[ip].marker;
      
      if(this.state.data[ip].active || !marker)
         return;

      var pan_and_zoom = function(_marker) {
         this.map.panTo(_marker.getCenter());
         this.map.setZoom(4);
      }.bind(this, marker);

      // forcing zoom out first allows for the fun transition
      if(this.map.getZoom() > 2) {
         this.map.setZoom(2);
         setTimeout(pan_and_zoom, 700);
      }
      else 
         pan_and_zoom();
      
      this.setActiveMarker(ip);
   },

   setActiveMarker: function(active_ip) {
      for(var ip in this.state.data)
         this.state.data[ip].active = (active_ip == ip);
     
      this.setState({data: this.state.data});
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
         radius: multiplier * 10000,
         visible: this.state.data[ip].blocked ? false : true
      };

      if(!this.state.data[ip].marker) {
         this.state.data[ip].marker = new google.maps.Circle(circleOptions);
         this.state.data[ip].marker.ip = ip;
         
         google.maps.event.addListener(this.state.data[ip].marker, 'click', function() {
            this.setActiveMarker(ip);
         }.bind(this));
      }

      else
         this.state.data[ip].marker.setOptions(circleOptions);

   },

   getInitialState: function() {
      return {data: {}};
   },

   componentDidMount: function() {
      
      this.createMap();

      jQuery.post(this.ajaxHost + '/ipblock', {reset: true});

      jQuery(document).on('vis.data', this.onNewVisData);
   },


   render: function() {
      
      // create an array of objects so they can be sorted
      var sorted = [];

      for(var ip in this.state.data) {
         sorted.push(this.state.data[ip]);

         // refresh marker as part of rendering
         this.setMarker(ip);
      }
      
      sorted.sort(this.sortByCountMax);

      // todo: figure out why this isn't available within the map()
      // see example http://facebook.github.io/react/tips/communicate-between-components.html
      var onBlockclick = this.onBlockClickToggle;
      var onIpClick = this.onIpClick;
      var self = this;

      return (
         <table className="table">

            <thead>
               <tr><th>IP</th><th># Reqs</th><th>Country</th></tr>
            </thead>

            <tbody>
               {sorted.map(function(entry) {

                  var rowClassString = entry.active ? 'active' : '';
                  var buttonTitle = entry.blocked ? 'Unblock' : 'Block';
                  var ipClass = entry.latitude ? 'ip_clickable' : '';

                  return (
                     <tr key={entry.ip} className={rowClassString}>
                        <td onClick={onIpClick.bind(self, entry.ip)} className={ipClass}>{entry.ip}</td>
                        <td>{entry.count}</td>
                        <td>{entry.country_name}</td>
                        <td><button type="button" className="btn btn-sm" onClick={onBlockclick.bind(self, entry.ip)}>{buttonTitle}</button></td>
                     </tr>
                  );
               })}
            </tbody>

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


$(function() {
   React.render(<HoneypotTable />, document.getElementById('honeypot-list'));
})
