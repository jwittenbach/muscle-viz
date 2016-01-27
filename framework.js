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

   // function to call after all entities have been defined
   // -----------------------------------------------------
   function finalize() {
      Entity.postLoad();
      Drawable.render();
   }

   // base class for storing assets
   // -----------------------------
   function Asset(filename) {
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
         finalize();
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

   // Base class for objects
   // ----------------------
   function Entity(kwargs) {
      kwargs = kwargs || {};
      this.attached = !!kwargs.attached; // default value is false
      Entity.items.push(this);
   }

   Entity.items = new Array;

   Entity.postLoad = function() {
      Entity.items.forEach(function(entity) {
         if (!entity.attached) {
            entity.postLoad();
         }
      });
   };


   Entity.prototype.postLoad = function() {};

   // Base class for objects that have a graphical representation
   // -----------------------------------------------------------
   function Drawable(x, y, kwargs) {
      Drawable.parent.constructor.call(this, kwargs);
      this.x = x;
      this.y = y;

      kwargs = kwargs || {};
      this.w = kwargs.width || kwargs.w;
      this.h = kwargs.height || kwargs.h;
      this.active = kwargs.active !== false; // default value is true

      Drawable.items.push(this);
   }

   extend(Drawable, Entity);

   Drawable.items = new Array;

   Drawable.render = function() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      Drawable.items.forEach(function(item) {
         if (item.active) item.draw();
      });
   };

   Drawable.prototype.draw = function() {};

   Drawable.prototype.activate = function() {
      if (!this.active) {
         this.active = true;
      }
   };

   Drawable.prototype.deactivate = function() {
      if (this.active) {
         this.active = false;
      }
   }

   // Drawable images
   // ---------------
   function Picture(x, y, img, kwargs) {
      Picture.parent.constructor.call(this, x, y, kwargs);
      this.img = img;
   }

   extend(Picture, Drawable);

   Picture.prototype.draw = function() {
      ctx.drawImage(this.img.data, this.x, this.y, this.w, this.h);
   };

   Picture.prototype.postLoad = function() {
      if (this.w == undefined || this.h == undefined) {
         var h = this.img.data.width;
         var w = this.img.data.height;
         if (this.w == undefined && this.h == undefined) {
            this.w = w;
            this.h = h;
         }
         else if (this.w == undefined) {
            this.w = (1.0*w/h)*this.h;
         }
         else {
            this.h = (1.0*h/w)*this.w;
         }
      }
   };

   // Base class for renderable text
   // ------------------------------
   function BaseText(x, y, kwargs) {
      BaseText.parent.constructor.call(this, x, y, kwargs);
      kwargs = kwargs || {};
      this.font = kwargs.font || "Arial";
      this.size = kwargs.size || 20;
      this.align = kwargs.align || "left";
      this.text = undefined;
   }

   extend(BaseText, Drawable);

   BaseText.prototype.draw = function() {
      ctx.fillStyle = 'rgb(0,0,0)';
      ctx.font = this.size.toString() + 'px' + ' ' + this.font;
      ctx.textAlign = this.align;
      ctx.fillText(this.text, this.x, this.y + this.size);
   };

   // Simple text
   // -----------
   function Text(x, y, text, kwargs) {
      Text.parent.constructor.call(this, x, y, kwargs);
      this.text = text;
   }

   extend(Text, BaseText);

   // Text loaded from JSON file
   function TextFromJSON(x, y, json, idx, kwargs) {
      Text.parent.constructor.call(this, x, y, kwargs);
      this.idx = idx;
      this.json = json;
   }

   extend(TextFromJSON, BaseText);

   TextFromJSON.prototype.postLoad = function() {
      if (typeof(this.idx) == "number" || typeof(this.idx) == "string") {
         this.idx = [this.idx];
      }
      var result = this.json.data;
      this.idx.forEach(function(idx) {
         result = result[idx];
      });
      this.text = result;
   };

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
      getCtx: getCtx,
      Asset: Asset,  // debug
      ImageAsset: ImageAsset,
      JSONAsset: JSONAsset,
      Picture: Picture,
      Text: Text,
      TextFromJSON, TextFromJSON
   }
})();
