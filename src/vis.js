var DataLog = React.createClass({

   getInitialState: function() { 
      return {data:[]}; // {data: ["{foo: bar}", "{zaz: foo}"]};
   },

   componentDidMount: function() {

      jQuery(document).on('vis.data', function(e, data) {
         var existing = this.state.data;
         existing.unshift(JSON.stringify(data));
         this.setState({data: existing});

      }.bind(this));
   },

   render: function() {

      var createItem = function(json) {
         return <p>{json}</p>;
      };

      return <p>{this.state.data.map(createItem)}</p>;
   }
});

var HoneypotList = React.createClass({
   
   getInitialState: function() {
      return {data: {}};
   },

   componentDidMount: function() {

      jQuery(document).on('vis.data', function(e, data) {

         if(!data.honeypot)
            return;
         
         if(!this.state.data[data.ip])
            this.state.data[data.ip] = {ip: data.ip, count: 1};
         else
            this.state.data[data.ip].count++;
         
         this.setState({data: this.state.data});

      }.bind(this));
   },

   render: function() {
      var createItem = function(data) {
         return <tr key={data.ip}><td>{data.ip}</td><td>{data.count}</td><td><input type="button" value="Block" /></td></tr>
      };
     
      var data = [];
      for(var i in this.state.data)
         data.push(this.state.data[i]);
      
      data.sort(this.sortByCountMax);

      return <table className="table"><tr><th>IP</th><th>Requests</th></tr>{data.map(createItem)}</table>;
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
   // React.render(<DataLog />, document.getElementById('data-log'));
   React.render(<HoneypotList />, document.getElementById('honeypot-list'));
})
