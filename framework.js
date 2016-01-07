var framework = (function() {

    var canvas;
    var ctx;

    // Initialization Function: set up canvas and interaction
    // ------------------------------------------------------
    function init(width, height, element) {

        canvas = document.createElement("canvas")

        // canvas size and look
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        canvas.setAttribute("style", "border: 2px solid")

        // event handling
        canvas.onclick = eventHandler.handle.bind(eventHandler);

        element.appendChild(canvas);

        ctx = canvas.getContext("2d");
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
    function Drawable(x, y, w, h, active) {
        this.x = x;
        this.y = y;
        this.active = active;
        this.w = w;
        this.h = h;

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
    function Picture(name, x, y, w, h, active) {
        Picture.parent.constructor.call(this, x, y, w, h, active)
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

    // BShape: Drawable that draws a shape defined by a Bezier curve
    // -------------------------------------------------------------
    function BShape(name, idx, x, y, w, h, color, lineWidth, active, dx, dy) {
        BShape.parent.constructor.call(this, x, y, w, h, active);
        this.jsonIdx = jsonStore.registerFile(name);
        this.idx = idx;
        this.color = color;
        this.lineWidth = lineWidth;
        dx == undefined ? this.dx = 0 : this.dx = dx;
        dy == undefined ? this.dy = 0 : this.dy = dy;
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
                    ctx.moveTo(this.dx+v[0], this.dy+v[1]);
                    first = false;
                }
                ctx.lineTo(this.dx+v[2], this.dy+v[3]);
            }
            else if (l.bezier) {
                v = l.bezier;
                if (first) {
                    ctx.moveTo(this.dx+v[0], this.dy+v[1]);
                    first = false;
                }
                ctx.bezierCurveTo(this.dx+v[2], this.dy+v[3], this.dx+v[4], this.dy+v[5], this.dx+v[6], this.dy+v[7]);
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
    function Interactable(x, y, w, h, active) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.active = active;
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
    function Button(x, y, w, h, imgName, active) {
        // Button is an Interactable
        Button.parent.constructor.call(this, x, y, w, h, active);
        eventHandler.add(this);

        // Button has a Drawable
        this.picture = new Picture(imgName, this.x, this.y, this.w, this.h, this.active);
        renderer.add(this.image);
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
    function Button2(x, y, w, h, image1, image2, active) {
        // Button2 is Interactable
        Button2.parent.constructor.call(this, x, y, w, h, active);
        eventHandler.add(this);

        // Button has two Drawables
        this.picture1 = new Picture(image1, this.x, this.y, this.w, this.h, this.active);
        this.picture2 = new Picture(image2, this.x, this.y, this.w, this.h, false);

        // keep track of state of the button, on/off
        this.state = false;
    }

    extend(Button2, Interactable);

    Button2.prototype.activate = function() {
        Button.parent.deactivate();
        this.picture1.deactivate();
        this.picture2.deactivate();
        this.state = false;
    };

    Button2.prototype.deactivate = function() {
        Button.parent.deactivate();
        this.picture1.activate();
        this.picture2.deactivate();
        this.state = false;
    };

    Button2.prototype.select = function() {
        if(!this.state) {
            this.state = true;
            this.picture1.deactivate();
            this.picture2.activate();
            renderer.draw();
        }
    };

    Button2.prototype.deselect = function() {
        if(this.state) {
            this.state = false;
            this.picture1.activate();
            this.picture2.deactivate();
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
        if (this.w == undefined) this.w = this.picture1.w;
        if (this.h == undefined) this.h = this.picture1.h;
    };

    // Button Panel: A horizontal panel of Button2 elements
    // ----------------------------------------------------
    function ButtonPanel(x, y, w, h, images1, images2, active, dw) {
        // ButtonPanel is Interactable, but never active
        ButtonPanel.parent.constructor.call(this, x, y, undefined, undefined, false);
        eventHandler.add(this);

        dw == undefined ? this.dw = 0 : this.dw = dw

        this.n = images1.length
        this.active = active;
        this.selected = -1;

        // array of Button2 elements
        this.buttons = new Array(this.n);

        var that = this;
        function handler() {
            that.change(this.buttonID);
        }
        for (var i=0; i<this.n; i++) {
            this.buttons[i] = new Button2(x, y, w, h, images1[i], images2[i], active);
            this.buttons[i].buttonID = i;
            this.buttons[i].onSelect = handler;
            this.buttons[i].onDeselect = handler;
        }
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
        if (this.w == undefined) this.w = this.buttons[0].picture1.w;
        if (this.h == undefined) this.h = this.buttons[0].picture1.h;
        for (var i=0; i<this.n; i++) {
            var x = this.x + i*(this.w + this.dw);
            this.buttons[i].x = x;
            this.buttons[i].picture1.x = x;
            this.buttons[i].picture2.x = x;
        }
    };

    // Helper functions
    // ----------------
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
        Picture: Picture,
        BShape: BShape,
        Button: Button,
        Button2: Button2,
        ButtonPanel: ButtonPanel,

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