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

    // Image Store: holds all loaded images for rendering
    // --------------------------------------------------
    var imageStore = {
        images: new Array,
        names: new Array,
        loaded: 0
    };

    imageStore.checkLoaded = function(name) {
        // check if the images has already been loaded
        for (var i=0; i<this.names.length; i++) {
            if (this.names[i] == name) {
                return i;
            }
        }
        return -1;
    };

    imageStore.registerImage = function(name) {
        // register an image for loading and subsequent use

        // if image has already been registered, simply return index
        var idx = this.checkLoaded(name);
        if (idx != -1) return idx;

        // if image not registered, append name and return index
        this.names.push(name);
        return this.names.length - 1;
    };

    imageStore.loadImages = function(onComplete) {
        nImages = this.names.length;

        var that = this;
        function onLoad() {
            that.loaded++;
            if (that.loaded == nImages) onComplete();
        }

        for (var i=0; i<this.names.length; i++) {
            this.images.push(new Image);
            this.images[i].onload = onLoad;
            this.images[i].src = this.names[i];
        }
    };

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
    function Drawable(name, x, y, active) {
        this.x = x;
        this.y = y;
        this.imgIdx = imageStore.registerImage(name);
        this.active = active;

        renderer.add(this);
    }

    Drawable.prototype.draw = function() {
        ctx.drawImage(imageStore.images[this.imgIdx], this.x, this.y);
    };

    Drawable.prototype.activate = function() {
        this.active = true;
        renderer.draw();
    };

    Drawable.prototype.deactivate = function() {
        this.active = false;
        renderer.draw();
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

    // Button: A simple clickable button
    // --------------------------
    function Button(x, y, image, active) {
        // Button is an Interactable
        Button.parent.constructor.call(this, x, y, -1, -1, active);
        eventHandler.add(this);

        // Button has a Drawable
        this.drawable = new Drawable(image, this.x, this.y, this.active);
        renderer.add(this.drawable);
    }

    extend(Button, Interactable);

    Button.prototype.activate = function() {
        Button.parent.activate();
        this.drawable.activate();
    };

    Button.prototype.deactivate = function() {
        Button.parent.deactivate();
        this.drawable.deactivate();
    };

    // Two-State Button: Button with two images for mousedown and mouseup
    // ------------------------------------------------------------------
    function Button2(x, y, image1, image2, active) {
        // Button2 is Interactable
        Button2.parent.constructor.call(this, x, y, -1, -1, active);
        eventHandler.add(this);

        // Button has two Drawables
        this.drawable1 = new Drawable(image1, this.x, this.y, this.active);
        this.drawable2 = new Drawable(image2, this.x, this.y, false);

        // for inferring Interactable size
        this.drawable = this.drawable1;

        // keep track of state of the button, on/off
        this.state = false;
    }

    extend(Button2, Interactable);

    Button2.prototype.handleClick = function() {
        if (this.state) {
            this.drawable1.activate();
            this.drawable2.deactivate();
            this.onDeactivate();
            renderer.draw();
        }
        else {
            this.drawable1.deactivate();
            this.drawable2.activate();
            this.onActivate();
            renderer.draw();
        }
        this.state = !this.state;
    };

    Button2.prototype.onActivate = function() {};
    Button2.prototype.onDeactivate = function() {};

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
        // load images and then set button sizes and draw

        imageStore.loadImages(function () {

            // set button boundaries from image sizes
            for (var i=0; i<eventHandler.interactables.length; i++) {
                interactable = eventHandler.interactables[i];
                if (interactable.hasOwnProperty("drawable")) {
                    idx = interactable.drawable.imgIdx;
                    img = imageStore.images[idx];
                    interactable.w = img.width;
                    interactable.h = img.height;
                }
            }

            // initial draw
            renderer.draw.bind(renderer)();
        })
    }

    // Expose elements of the framework by returning them
    // --------------------------------------------------
    return {
        init: init,
        loadAndDraw: loadAndDraw,
        Button: Button,
        Button2: Button2,

        Drawable: Drawable,
        Interactable: Interactable,
        imageStore: imageStore,
        renderer: renderer,
        eventHandler: eventHandler,
        canvas: canvas,
        ctx: ctx
    };

})();