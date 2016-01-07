var width = 1000;
var height = 700;

// initialize framework
framework.init(width, height, document.body);

// add elements and event handlers

var colors = new Array();
colors[0] = "rgb(255,255,255)"; colors[1] = "rgb(150,0,0)"; colors[2] = "rgb(0,150,0)"; colors[3] = "rgb(0,0,150)";

var shape = new framework.BShape("shapes.json", 0, 10, 10, undefined, undefined, colors[0], 2, true, -375, 575);

var nButtons = 3;
var imagesOff = new Array(3)
var imagesOn = new Array(3);
for (var i=0; i<nButtons; i++) {
    imagesOff[i] = "b" + (i+1) + "-20-off.png";
    imagesOn[i] = "b" + (i+1) + "-20-on.png";
}
var buttons = new framework.ButtonPanel(300, 100, undefined, undefined, imagesOff, imagesOn, true, -2);
buttons.onChange = function() {
    shape.color = colors[this.selected+1];
    framework.renderer.draw()
};

// load assets and initial draw
framework.loadAndDraw();