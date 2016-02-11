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
      canvas.onclick = Interactable.handleEvent.bind(Interactable);

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

   // Collection of Bezier curves
   // ---------------------------
   function Curves(x, y, json, kwargs) {
      Curves.parent.constructor.call(this, x, y, kwargs);
      this.json = json;
      kwargs = kwargs || {};
      this.colors = kwargs.colors || "rgb(255, 255, 255)";
      this.lineWidth = kwargs.lineWidth || 2;
      this.dx = kwargs.dx || 0;
      this.dy = kwargs.dy || 0;
      this.lineWidth = kwargs.lineWidth || 2;
   }

   extend(Curves, Drawable);

   Curves.prototype.draw = function() {
      for(var i=0; i<this.nshapes; i++) {
         ctx.fillStyle = this.colors[i];
         ctx.lineStyle = 'rgb(0,0,0)';
         ctx.lineWidth = this.lineWidth;

         var shape = this.json.data[i];

         ctx.beginPath();
         var first = true;
         for (var i=0; i<shape.length; i++) {
            l = shape[i];
            if (l.line) {
               v = l.line;
               if (first) {
                  ctx.moveTo(this.x+v[0], this.y+v[1]);
                  first = false;
               }
               ctx.lineTo(this.x+v[2], this.y+v[3]);
            }
            else if (l.bezier) {
               v = l.bezier;
               if (first) {
                  ctx.moveTo(this.x+v[0], this.y+v[1]);
                  first = false;
               }
               ctx.bezierCurveTo(this.x+v[2], this.y+v[3], this.x+v[4], this.y+v[5], this.x+v[6], this.y+v[7]);
            }
         }
         ctx.closePath();
         ctx.stroke();
         ctx.fill();
      }
   };

   Curves.prototype.setColor = function(i, color) {
      this.colors[i] = color;
   };

   Curves.prototype.postLoad = function() {
      // handle colors
      this.nshapes = this.json.data.length;
      if (typeof(this.colors) === "string") {
         var array = new Array(this.nShapes);
         for(var i=0; i<this.nshapes; i++) {
            array[i] = this.colors;
         }
         this.colors = array;
      }

      // handle dimensions
      if (this.w !== undefined || this.h !== undefined || this.dx != 0 || this.dy != 0) {
         var maxVals = new Array(2);
         var offsets = [this.dx, this.dy];

         // first pass applies offsets and computes maximum values
         this.json.data.forEach(function(strokes) {
            strokes.forEach(function(stroke) {
               if (stroke.hasOwnProperty('line')) var type = 'line';
               else if (stroke.hasOwnProperty('bezier')) var type = 'bezier';
               else return;
               for (var i=0; i<stroke[type].length; i++) {
                  var idx = i%2;
                  stroke[type][i] += offsets[idx];
                  var val = stroke[type][i];
                  if (val > maxVals[idx] || maxVals[idx] === undefined) maxVals[idx] = val;
               }
            });
         });
      }

      // set height and width
      if (this.w === undefined && this.h === undefined) {
         this.w = maxVals[0];
         this.h = maxVals[1];
         return;
      }
      else {
         if (!(this.w !== undefined && this.h !== undefined)) {
            if (this.h === undefined) {
               this.h = (1.0*maxVals[1]/maxVals[0])*this.w;
            }
            else {
               this.w = (1.0*maxVals[0]/maxVals[1])*this.h;
            }
         }

         // potential second pass scales values
         var scales = [1.0*this.w/maxVals[0], 1.0*this.h/maxVals[1]];
         this.json.data.forEach(function(strokes) {
            strokes.forEach(function(stroke) {
               if (stroke.hasOwnProperty('line')) var type = 'line';
               else if (stroke.hasOwnProperty('bezier')) var type = 'bezier';
               else return;
               for (var i=0; i<stroke[type].length; i++) {
                  var idx = i%2
                  stroke[type][i] *= scales[idx];
               }
            });
         });
      }
   };

   // Base class for entities that can be interacted with
   // ---------------------------------------------------
   function Interactable(x, y, kwargs) {
      Interactable.parent.constructor.call(this, kwargs);
      this.x = x;
      this.y = y;
      kwargs = kwargs || {};
      this.w = kwargs.width || kwargs.w;
      this.h = kwargs.height || kwargs.h;

      Interactable.items.push(this);
   }

   extend(Interactable, Entity);

   Interactable.items = new Array;

   Interactable.map = {
      // maps event types to event handler names
      "click": "handleClick",
   };

   Interactable.handleEvent = function(event) {
      var handler = Interactable.map[event.type];
      if (handler) {
         Interactable.items.forEach(function(interactable) {
            if (Interactable.checkHit(event, interactable)) {
               interactable[handler](event)
            }
         });
      }
   };

   Interactable.checkHit = function(event, interactable) {
      var x = event.pageX - canvas.offsetLeft;
      var y = event.pageY - canvas.offsetTop;
      var checkX = x > interactable.x && x < (interactable.x + interactable.w);
      var checkY = y > interactable.y && y < (interactable.y + interactable.h);
      return checkX && checkY;
   };

   Interactable.prototype.handleClick = function(event) {};

   // Two-state button
   // ----------------
   function Button2(x, y, img0, img1, kwargs) {
      Button2.parent.constructor.call(this, x, y, kwargs);
      this.img0 = img0;
      this.img1 = img1;

      this.state = 0;
   }

   extend(Button2, Interactable);

   Button2.prototype.postLoad = function() {

      this.pic0 = new Picture(this.x, this.y, this.img0, {attached:true, active:true});
      this.pic1 = new Picture(this.x, this.y, this.img1, {attached:true, active:false});

      this.pic0.postLoad();
      this.pic1.postLoad();

      if (this.w === undefined || this.h === undefined) {
         if (this.w === undefined && this.h === undefined) {
            this.w = this.pic0.w;
            this.h = this.pic0.h;
         }
         else if (this.w === undefined) {
            this.h = (1.0*this.pic0.h/this.pic0.w)*this.w;
         }
         else if (this.h === undefined) {
            this.w = (1.0*this.pic0.w/this.pic0.h)*this.h;
         }
      }

      this.pic0.h = this.h;
      this.pic0.w = this.w;
      this.pic1.h = this.h;
      this.pic1.w = this.w;
   };

   Button2.prototype.handleClick = function(event) {
      if (this.state) {
         this.pic0.activate();
         this.pic1.deactivate();
         this.state = 0;
         this.onSelect();
         Drawable.render();
      }
      else {
         this.pic0.deactivate();
         this.pic1.activate();
         this.state = 1;
         this.onDeselect();
         Drawable.render();
      }
   };

   Button2.prototype.select = function() {
      if(!this.state) {
           this.state = true;
           this.pic0.deactivate();
           this.pic1.activate();
           Drawable.render();
      }
   };

   Button2.prototype.deselect = function() {
      if(this.state) {
           this.state = false;
           this.pic0.activate();
           this.pic1.deactivate();
           Drawable.render();
      }
   };

   Button2.prototype.onSelect = function() {};
   Button2.prototype.onDeselect = function() {};

   // Panel of buttons
   // ----------------
   function ButtonPanel(x, y, images0, images1, kwargs) {
      ButtonPanel.parent.constructor.call(this, kwargs);

      this.x = x;
      this.y = y;
      this.images0 = images0;
      this.images1 = images1;

      kwargs = kwargs || {};
      this.w = kwargs.width || kwargs.w;
      this.h = kwargs.height || kwargs.h;
      this.dw = kwargs.dw || 0;

      this.n = images0.length
      this.selected = -1;

      this.buttons = new Array(this.n);
      for (var i=0; i<this.n; i++) {

      }
   }

   extend(ButtonPanel, Entity);

   ButtonPanel.prototype.postLoad = function() {

      var w0;
      var img = this.images0[0].data

      if (this.w === undefined) {
         if (this.h === undefined) {
            w0 = img.width;
            this.h = img.height;
         }
         else {
            w0 = (1.0*img.width/img.height)*this.h;
         }
      }
      else{
         w0 = 1.0*(this.w - (this.n - 1)*this.dw)/this.n;
         if (this.h === undefined) {
            this.h = (1.0*img.height/img.width)*w0;
         }
      }

      var that = this;
      function handler() {
          that.change(this.buttonID);
      }

      for (var i=0; i<this.n; i++) {
         var x = this.x + i*(w0 + this.dw);
         console.log(images0[i].data)
         this.buttons[i] = new Button2(x, this.y, images0[i], images1[i], {w:w0, h:this.h, attached:true});
         this.buttons[i].buttonID = i;
         this.buttons[i].onSelect = handler;
         this.buttons[i].onDeselect = handler;
         this.buttons[i].postLoad();
      }
   };

   ButtonPanel.prototype.change = function(buttonID) {
      preID = this.selected;
      postID = buttonID;

      if (postID == preID) {
           this.buttons[postID].deselect();
           this.selected = -1;
      }
      else {
           if (this.selected != -1) this.buttons[preID].deselect();
           this.buttons[postID].select();
           this.selected = postID;
      }

      this.onChange();
   };


   // Simple stateless button
   // -----------------------

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
      TextFromJSON, TextFromJSON,
      Curves, Curves,
      Interactable: Interactable, // debug
      Button2: Button2,
      Entity: Entity, // debug
      ButtonPanel: ButtonPanel
   }
})();
