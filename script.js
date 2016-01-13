var height = 700;
var width = 1000;

framework.init(width, height, document.body);

// colors
var colorMap = ['rgb(240,240,240)','rgb(165,0,38)','rgb(244,109,67)','rgb(254,224,144)',
                'rgb(224,243,248)','rgb(116,173,209)','rgb(49,54,149)'];

// shapes
var file = "shapes.json";
var nMuscles = 26;
var dx = -375, dy = 560;
var x = 315, y = 25;

var body = new framework.BShape(file, 0, x+dx, y+dy, undefined, undefined, colorMap[0], 2, true);

var muscles = new Array(nMuscles);
for (var i=0; i<nMuscles; i++) {
	muscles[i] = new framework.BShape(file, i+1, x+dx, y+dy, undefined, undefined, colorMap[0], 2, true);
}

// muscle names setup
file = "muscles.json";
var size = 17;
var font = "Arial"
var type = size + "px " + font;
var spacing = 1.25;
var xleft = 25, xright = 530;
y = 75;

var names = new Array(nMuscles);
for (var i=0; i<nMuscles; i++) {
	if (i<nMuscles/2) {
		x = xleft;
		var j = i;
	}
	else {
		x = xright;
		var j = i - nMuscles/2;
	}
	names[i] = new framework.Text(file, j, x, y + j*spacing*size, undefined, undefined, type, true);
}

// buttons
var nLevels = 5;
var xoffset = 175;

var imagesOff = new Array(nLevels);
var imagesOn = new Array(nLevels);
function leadingZeros(integer, nDigits) {
	s = integer.toString();
	return "0".repeat(nDigits-s.length) + s;
}
for (var i=0; i<nLevels; i++) {
	imagesOff[i] = "buttons-" + leadingZeros(i+1, 2) + ".png";
	imagesOn[i] = "buttons-" + leadingZeros(nLevels+i+1, 2) + ".png";
}

var buttons = new Array(nMuscles);
for (var i=0; i<nMuscles; i++) {
	x = names[i].x + xoffset;
	y = names[i].y - size;
	buttons[i] = new framework.ButtonPanel(x, y, 20, undefined, imagesOff, imagesOn, true, -1);
	buttons[i].muscle = i;
	buttons[i].onChange = function() {
		muscles[this.muscle].color = colorMap[this.selected+1];
		framework.renderer.draw();
	}
}



framework.loadAndDraw();