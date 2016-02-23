var framework = (function() {

    var canvas;
    var ctx;

    // Initialization Function: set up canvas and interaction
    // ------------------------------------------------------
    function init(width, height, kwargs) {
        kwargs = kwargs || {};
        var element = kwargs.element || document.body;

        var a = 1;
        canvas = document.createElement("canvas")

        // canvas size and look
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);

        // event handling
        canvas.onclick = eventHandler.handle.bind(eventHandler);

        element.appendChild(canvas);

        ctx = canvas.getContext("2d");
        ctx.translate(0.5, 0.5);
    }

    // Store: an object to hold data to be loaded
    // ------------------------------------------
    function Store(type) {
        this.type = type;

        this.data = new Array;
        this.names = new Array;
        this.loaded = 0;
    }

    Store.prototype.checkLoaded = function(name) {
        for (var i=0; i<this.names.length; i++) {
            if (this.names[i] == name) return i;
        }
        return -1;
    };

    Store.prototype.registerFile = function(name) {
        // register a file for loading and subsequent use

        // if file has already been registered, simply return index
        var idx = this.checkLoaded(name);
        if (idx != -1) return idx;

        // if file not registered, append name and return index
        this.names.push(name);
        return this.names.length - 1;
    };

    Store.prototype.loadFiles = function(onComplete) {
        if (this.type == 'image') this.loadImages(onComplete);
        if (this.type == 'json') this.loadJSON(onComplete);
    }

    Store.prototype.loadImages = function(onComplete) {
        var nFiles = this.names.length;
        if (nFiles == 0) onComplete();

        var that = this;
        function onLoadImage() {
            that.loaded++;
            if (that.loaded == nFiles) onComplete();
        }

        for (var i=0; i<this.names.length; i++) {
            this.data.push(new Image);
            this.data[i].onload = onLoadImage;
            this.data[i].src = this.names[i];
        }
    };

    Store.prototype.loadJSON = function(onComplete) {
        var nFiles = this.names.length;
        if (nFiles == 0) onComplete();
        var requests = Array(nFiles);

        var that = this;
        function onLoadJSON() {
            if (this.readyState == 4 && this.status == 200) {
                that.data[this.idx] = JSON.parse(this.responseText)
                that.loaded++;
                if (that.loaded == nFiles) onComplete();
            }
        }

        for (var i=0; i<this.names.length; i++) {
            requests[i] = new XMLHttpRequest;
            requests[i].idx = i;
            requests[i].onreadystatechange = onLoadJSON;
            requests[i].open("GET", this.names[i], true);
            requests[i].send();
        }
    }

    // Stores for holing Images to and JSON shapes for drawing
    // -------------------------------------------------------
    var imageStore = new Store("image");
    var jsonStore = new Store("json");

    // Renderer: Holds all Drawables for rendering
    // -------------------------------------------
    var renderer = {
        drawables: new Array
    };

    renderer.add = function(drawable) {
        this.drawables.push(drawable);
    };

    renderer.draw = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i=0; i<this.drawables.length; i++) {
            if (this.drawables[i].active) this.drawables[i].draw();
        }
    };

    // Drawable: Holds data/functions needed to draw an element to the canvas
    // ----------------------------------------------------------------------
    function Drawable(x, y, kwargs) {
        this.x = x;
        this.y = y;
        kwargs = kwargs || {};
        this.active = kwargs.active !== false; // default value is true
        this.w = kwargs.width || kwargs.w;
        this.h = kwargs.height || kwargs.h;

        renderer.add(this);
    }

    Drawable.prototype.activate = function() {
        this.active = true;
        renderer.draw();
    };

    Drawable.prototype.deactivate = function() {
        this.active = false;
        renderer.draw();
    };

    // over-ride these functions in children
    Drawable.prototype.draw = function() {};
    Drawable.prototype.postLoad = function() {};

    // Picture: Drawable that draws an image
    // -------------------------------------
    function Picture(x, y, name, kwargs) {
        console.log(name);
        console.log(kwargs);
        Picture.parent.constructor.call(this, x, y, kwargs)
        console.log(this.active);
        this.imgIdx = imageStore.registerFile(name);
    }

    extend(Picture, Drawable);

    Picture.prototype.draw = function() {
        ctx.drawImage(imageStore.data[this.imgIdx], this.x, this.y, this.w, this.h);
    };

    Picture.prototype.postLoad = function() {
        if (this.w == undefined || this.h == undefined) {
            img = imageStore.data[this.imgIdx];
            if (this.w == undefined && this.h == undefined) {
                this.w = img.width;
                this.h = img.height;
            }
            else if (this.w == undefined) {
                this.w = (1.0*img.width/img.height)*this.h;
            }
            else {
                this.h = (1.0*img.height/img.width)*this.w;
            }
        }
    };

    // Text: Renderable text
    // ---------------------
    function Text(x, y, name, idx, kwargs) {
        Text.parent.constructor.call(this, x, y, kwargs);
        this.idx = idx;
        this.jsonIdx = jsonStore.registerFile(name);
        kwargs = kwargs || {};
        this.font = kwargs.font || "Arial 20px"
        this.align = kwargs.align || "left"
    }

    extend(Text, Drawable);

    Text.prototype.draw = function() {
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.font = this.font;
        ctx.textAlign = this.align;
        ctx.fillText(jsonStore.data[this.jsonIdx][this.idx], this.x, this.y);
    };


    // BShape: Drawable that draws a shape defined by a Bezier curve
    // -------------------------------------------------------------
    function BShape(x, y, name, idx, kwargs) {
        BShape.parent.constructor.call(this, x, y, kwargs);
        this.idx = idx;
        this.jsonIdx = jsonStore.registerFile(name);
        kwargs = kwargs || {};
        this.color = kwargs.color || "rgb(255, 255, 255)";
        this.lineWidth = kwargs.lineWidth || 2;

    }

    extend(BShape, Drawable);

    BShape.prototype.draw = function() {
        var shape = jsonStore.data[this.jsonIdx][this.idx];

        ctx.fillStyle = this.color;
        ctx.lineStyle = "rgb(0,0,0)";
        ctx.lineWidth = this.lineWidth;


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
    };

    // Event Handler: Holds all Interactables for event handling
    // ---------------------------------------------------------
    var eventHandler = {
        interactables: new Array
    };

    eventHandler.add = function(interactable) {
        this.interactables.push(interactable);
    };

    eventHandler.map = {
        // maps event types to event handler names
        "click": "handleClick",
    };

    eventHandler.checkHit = function(event, interactable) {
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        var checkX = x > interactable.x && x < (interactable.x + interactable.w);
        var checkY = y > interactable.y && y < (interactable.y + interactable.h);
        return checkX && checkY;
    }

    eventHandler.handle = function(event) {
        for (var i=0; i<this.interactables.length; i++) {
            handler = this.map[event.type];
            interactable = this.interactables[i];
            if (interactable.active && interactable[handler] && this.checkHit(event, interactable)) {
                interactable[handler](event);
            }
        }
    };

    // Interactable: Holds data/functions needed for interactive elements
    // ------------------------------------------------------------------
    function Interactable(x, y, w, h, kwargs) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        kwargs = kwargs || {};
        this.active = kwargs.active !== false; //default value is true
    }

    Interactable.prototype.handleClick = false;

    Interactable.prototype.activate = function() {
        this.activate = true;
    };

    Interactable.prototype.deactivate = function() {
        this.active = false;
    };

    Interactable.prototype.postLoad = function() {};

    // Button: A simple clickable button
    // ---------------------------------
    function Button(x, y, w, h, imgName, kwargs) {
        // Button is an Interactable
        Button.parent.constructor.call(this, x, y, w, h, kwargs);

        // Button has a Drawable
        var imgName = args.imgName;
        this.picture = new Picture(imgName, this.x, this.y, this.w, this.h, this.active);
    }

    extend(Button, Interactable);

    Button.prototype.activate = function() {
        Button.parent.activate();
        this.picture.activate();
    };

    Button.prototype.deactivate = function() {
        Button.parent.deactivate();
        this.picture.deactivate();
    };

    Button.prototype.postLoad = function() {
        if (this.w == undefined) this.w = this.picture.w;
        if (this.h == undefined) this.h = this.picture.h;
    };

    // Two-State Button: Button with two images for mousedown and mouseup
    // ------------------------------------------------------------------
    function Button2(x, y, image0, image1, kwargs) {
        // Button2 is Interactable
        Button2.parent.constructor.call(this, x, y, undefined, undefined, kwargs);
        eventHandler.add(this);

        kwargs = kwargs || {};
        this.w = kwargs.w || kwargs.width;
        this.h = kwargs.h || kwargs.height;

        // Button has two Drawables
        this.picture0 = new Picture(this.x, this.y, image0, {w: this.w, h: this.h, active: true});
        this.picture1 = new Picture(this.x, this.y, image1, {w: this.w, h: this.h, active: false});;

        // keep track of state of the button, on/off
        this.state = false;

        if (!this.active) this.deactivate();
    }

    extend(Button2, Interactable);

    Button2.prototype.deactivate = function() {
        Button.parent.deactivate();
        this.picture1.deactivate();
        this.picture2.deactivate();
        this.state = false;
    };

    Button2.prototype.activate = function() {
        Button.parent.activate();
        this.picture1.activate();
        this.picture2.deactivate();
        this.state = false;
    };

    Button2.prototype.select = function() {
        if(!this.state) {
            this.state = true;
            this.picture0.deactivate();
            this.picture1.activate();
            renderer.draw();
        }
    };

    Button2.prototype.deselect = function() {
        if(this.state) {
            this.state = false;
            this.picture0.activate();
            this.picture1.deactivate();
            renderer.draw();
        }
    };

    Button2.prototype.handleClick = function() {
        if (this.state) {
            this.deselect();
            this.onDeselect();
        }
        else {
            this.select();
            this.onSelect();
        }
    };

    Button2.prototype.onSelect = function() {};
    Button2.prototype.onDeselect = function() {};

    Button2.prototype.postLoad = function() {
        if (this.w == undefined) this.w = this.picture0.w;
        if (this.h == undefined) this.h = this.picture0.h;
    };

    // Button Panel: A horizontal panel of Button2 elements
    // ----------------------------------------------------
    function ButtonPanel(x, y, images0, images1, kwargs) {
        // ButtonPanel is Interactable, but never active -- used for post-load update
        ButtonPanel.parent.constructor.call(this, x, y, undefined, undefined, kwargs);

        kwargs = kwargs || {};
        this.w = kwargs.w;
        this.h = kwargs.h;
        this.dw = kwargs.dw || 0;
        this.active = kwargs.active || true;

        this.n = imagesOn.length
        this.selected = -1;

        // array of Button2 elements
        this.buttons = new Array(this.n);

        var that = this;
        function handler() {
            that.change(this.buttonID);
        }
        for (var i=0; i<this.n; i++) {
            this.buttons[i] = new Button2(this.x, this.y, images0[i], images1[i], {w: this.w, h: this.h, active: this.active});
            this.buttons[i].buttonID = i;
            this.buttons[i].onSelect = handler;
            this.buttons[i].onDeselect = handler;
        }

        eventHandler.add(this);
    }

    extend(ButtonPanel, Interactable);

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

    ButtonPanel.prototype.activate = function() {
        for (var i=0; i<this.n; i++) {
            this.buttons[i].activate();
        }
    };

    ButtonPanel.prototype.deactivate = function() {
        for (var i=0; i<this.n; i++) {
            this.buttons[i].deactivate();
        }
    };

    ButtonPanel.prototype.onChange = function() {};

    ButtonPanel.prototype.postLoad = function() {
        if (this.w == undefined) this.w = this.buttons[0].picture0.w;
        if (this.h == undefined) this.h = this.buttons[0].picture0.h;
        for (var i=0; i<this.n; i++) {
            var x = this.x + i*(this.w + this.dw);
            this.buttons[i].x = x;
            this.buttons[i].picture0.x = x;
            this.buttons[i].picture1.x = x;
        }
    };

    // Helper functions
    // ----------------
    function getCtx() {
        return ctx;
    }

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

    function loadAndDraw() {
        // after all loading is finished
        var final = function () {
            // infer unset Drawable dimensions from loaded objects
            for (var i=0; i<renderer.drawables.length; i++) {
                renderer.drawables[i].postLoad();
            }

            // infer unset Interactable dimensions from loaded objects
            for (var i=0; i<eventHandler.interactables.length; i++) {
                eventHandler.interactables[i].postLoad();
            }

            // initial draw
            renderer.draw.bind(renderer)();
        };

        var that = this;
        var afterJSON = function() {
            imageStore.loadFiles(final);
        }

        jsonStore.loadFiles(afterJSON);
    }

    // Expose elements of the framework by returning them
    // --------------------------------------------------
    return {

        init: init,
        loadAndDraw: loadAndDraw,
        Store, Store,
        Picture: Picture,
        Text: Text,
        BShape: BShape,
        Button: Button,
        Button2: Button2,
        ButtonPanel: ButtonPanel,
        getCtx: getCtx,

        Drawable: Drawable,
        Interactable: Interactable,
        imageStore: imageStore,
        jsonStore: jsonStore,
        renderer: renderer,
        eventHandler: eventHandler,
        canvas: canvas,
        ctx: ctx
    };

})();
