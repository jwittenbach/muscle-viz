var framework = (function() {

   // global variables + accessor functions
   // -------------------------------------
   var canvas;
   var ctx;

   function getCtx() {
      return ctx;
   }

   // initialize framework
   // --------------------
   function init(width, height, kwargs) {
      kwargs = kwargs || {};
      var element = kwargs.element || document.body;

      var a = 1;
      canvas = document.createElement("canvas")

      // canvas size and look
      canvas.setAttribute("width", width);
      canvas.setAttribute("height", height);

      // event handling
      //canvas.onclick = eventHandler.handle.bind(eventHandler);

      element.appendChild(canvas);

      ctx = canvas.getContext("2d");
      ctx.translate(0.5, 0.5);
   }

   // classes for storing assets
   // ------------------------
   function Asset(filename) {
      console.log('in Asset constructor');
      this.filename = filename;
      this.data = null;
      this.loadData(filename);
   }

   Asset.nAssets = 0;
   Asset.nLoaded = 0;

   Asset.prototype.loadData = function() {
      Asset.nAssets += 1;
   };

   Asset.prototype.onLoad = function() {
      Asset.nLoaded += 1;
      if (Asset.nLoaded == Asset.nAssets) {
         console.log('all loaded');
      }
   };

   // image assets
   // ------------
   function ImageAsset(filename) {
      ImageAsset.parent.constructor.call(this, filename);
   }

   extend(ImageAsset, Asset);

   ImageAsset.prototype.loadData = function(filename) {
      ImageAsset.parent.loadData.call(this);
      this.data = new Image;
      this.data.onload = this.onLoad;
      this.data.src = this.filename;
   }

   // JSON assets
   // -----------
   function JSONAsset(filename) {
      JSONAsset.parent.constructor.call(this, filename);
   }

   extend(JSONAsset, Asset);

   JSONAsset.prototype.loadData = function(filename) {
      JSONAsset.parent.loadData.call(this);
      var request = new XMLHttpRequest;
      request.open('GET', filename, true);
      var that = this;
      request.onreadystatechange = function() {
         if (this.readyState == 4 && this.status == 200) {
             that.data = JSON.parse(this.responseText)
             that.onLoad();
         }
      }
      request.send(null);
   }

   // OOP functions
   // -------------
   function inherit(proto) {
      function F() {}
      F.prototype = proto
      return new F
   }

   function extend(Child, Parent) {
     Child.prototype = inherit(Parent.prototype)
     Child.prototype.constructor = Child
     Child.parent = Parent.prototype
   }

   // expose desired elements
   // -----------------------
   return {
      init: init,
      Asset: Asset, // debug
      ImageAsset: ImageAsset,
      JSONAsset: JSONAsset
   }
})();
