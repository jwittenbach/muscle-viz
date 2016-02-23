// initialize framework
framework.init(1500, 750);

// numbers of various elements
var nLevels = 6;
var nMuscles = 26;
var nShape = nMuscles + 1;

// spacing/sizing
var xTextLeft = 10;
var xButtonsLeft = 210;
var xBody = 350;
var xButtonsRight = 610;
var xTextRight = 760;
var yBody = 10;
var dyButtons = 30;
var hButtons = 30;
var hBody = 700;

// color map
var colorMap = ['rgb(240,240,240)','rgb(165,0,38)','rgb(244,109,67)','rgb(254,224,144)',
                'rgb(224,243,248)','rgb(116,173,209)','rgb(49,54,149)'];

// load assets -- images
var imgsOff = new Array(nLevels);
var imgsOn = new Array(nLevels);
for (var i=0; i<2*nLevels; i++) {
	// handle zero-padding
	if (i<9) var filename = 'buttons-0' + (i+1) + '.png';
	else var filename = 'buttons-' + (i+1) + '.png';
	// first half of images are for off, second half for on
	if (i < nLevels) imgsOff[i] = new framework.ImageAsset(filename);
	else imgsOn[i-nLevels] = new framework.ImageAsset(filename);
}
var fullStrImg = new framework.ImageAsset('fullstrength.png');

// load assets -- text
var muscleNames = new framework.JSONAsset('muscles.json');

// load assets -- shapes
var shapes = new framework.JSONAsset('shapes.json');

// create objects -- curves
var curves = new framework.Curves(xBody, yBody, shapes, {dx:-375, dy:560,
											 h:hBody, lineWidth:3, colors:colorMap[0]});

// create objects -- button panels and labels
var labels = new Array(nMuscles);
var buttons = new Array(nMuscles);
var y0 = yBody;
var dy = dyButtons;
for (var i=0; i<nMuscles; i++) {
	// left side
	if (i < nMuscles/2) {
		var x1 = xTextLeft;
		var x2 = xButtonsLeft;
		var j = i;
		var align = "left";
	}
	// right side
	else {
		var x1 = xTextRight;
		var x2 = xButtonsRight;
		var j = i - nMuscles/2;
		var align = "left";
	}
	labels[i] = new framework.TextFromJSON(x1, y0 + dy*j, muscleNames, j, {align:align});
	buttons[i] = new framework.ButtonPanel(x2, y0 + dy*j, imgsOff, imgsOn, {h:25, dw:-1.5});
	buttons[i].muscle = i+1;
	buttons[i].onChange = function() {
		curves.setColor(this.muscle, colorMap[this.selected+1]);
	};
}

// create objects -- full-strength button
var fullStrButton = new framework.Button1(100, 450, fullStrImg, {w:125});
fullStrButton.handleClick = function() {
	for (var i=0; i<nMuscles; i++) {
 		if (buttons[i].selected === -1) {
 			buttons[i].buttons[nLevels-1].handleClick();
 		}
 	};
}

// create objects -- legend
var labels = new Array(nLevels)
for (var i=0; i<nLevels; i++) {
   labels[i] = i;
}
var rect = new framework.ColorPanel(xButtonsRight, 450, 50, 50, colorMap.slice(1), {labels:labels});
