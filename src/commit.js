var Commit = React.createClass({
   
   /**
    * This object's parent DOM node in jQuery wrapper
    */
   parentEl: null,

   /**
    * The chosen <LI> that tihs commit will be attached to
    */
   refEl: null,

   /**
    * Try to find a corresponding element in the graph library that matches the time
    * for this element.
    * 
    * todo: keep a queue of unmatched Commit objects, if too far in the future, and 
    * try to rematch occasionally
    */
   assignRefEl: function() {
      var ul = jQuery('#graph-images ul');
      
      if(!ul.length || !ul.find('li:first').length)
         return false;
   
      // todo: this is a good place to binary search, especially if someone leaves the page open a long time
      var li = ul.find('li:first');

      while(li.length) {

         var start = parseInt(li.attr('data-start')),
             end   = parseInt(li.attr('data-end'));

         if(start && end && this.props.time >= start && this.props.time <= end) {
            this.refEl = li;
            break;
         }
         
         li = li.next();
      }
      
      if(!this.refEl)
         return false;
   
      this.refEl.append(this.parentEl);

      return this.refEl;
   },

   onClickGlyph: function() {
      jQuery('#graph-images').trigger('stop');
      this.state.visible = !this.state.visible;
      this.setState(this.state);
   },

   componentDidMount: function() {
      
      this.parentEl = jQuery('#commit-' + this.props.sha).closest('.commit-wrap');

      if(!this.assignRefEl()) {
         React.unmountComponentAtNode(this.parentEl.get(0));
         jQuery(this.parentEl.remove());
      }
   },

   getInitialState: function() {
      return {visible: false};
   },

   render: function() {

      console.log(this.props);

      var id = "commit-" + this.props.sha;
      var mailto = "mailto:" + this.props.dev.email;
      var glyphTitle = this.props.sha + '-' + this.props.message;
      
      return (
         <div id={id} className="commit">
            <i className="fa fa-github" title={glyphTitle} onClick={this.onClickGlyph}></i>

            <div className="body">

               <div className="dev">
                  <img src={this.props.dev.avatar} /> 
                  {this.props.dev.name} 
                  <a href={mailto}>{this.props.dev.email}</a>
               </div>

               <div className="commit">
                  <span className="sha">{this.props.sha}</span> -
                  <span className="message">{this.props.message}</span>

                  <div>{this.props.date}</div>
                  
                  <div className="diff">{this.props.diff}</div>
               </div>
            </div>

         </div>
      );
   }
});
