var params = {};
var muscleElements = {
	left: [],
	right: []
};
var buttons = {
	left: [],
	right: []
};
var state = {
	muscles: {
		left: [],
		right: []
	},
	name: ""
}

// load SVG file with image
var xhr = new XMLHttpRequest();
xhr.open("GET", "muscle-outline.svg", true);
xhr.overrideMimeType("image/svg+xml");
xhr.send();
xhr.onload = function(e) {
	svg = document.getElementById("centerPanel").appendChild(xhr.responseXML.documentElement);
	svg.id = "body";
	svg.setAttribute("height", "100%");
	svg.setAttribute("width", "100%");
	setParamsFromSVG(svg);
	makeButtonBanks(svg);
	makeMisc();
}

// translate name from SVG to human-readable form
function parseName(name) {
	return name.slice(0, -2).replace("_x2F_", "/").replace("_", " ")
}

// translate hex to rgb
function hexToRgb(hex) {
	var bigint = parseInt(hex, 16);
	var r = (bigint >> 16) & 255;
   var g = (bigint >> 8) & 255;
   var b = bigint & 255;

   return "rgb(" + r + "," + g + "," + b + ")";
}

// add alpha value to rgb color
function addAlpha(rgb, alpha) {
	return "rgba(" + rgb.slice(4, -1) + "," + alpha + ")";
}

// use SVG to extract # of shapes, # of levels, and color map
function setParamsFromSVG(svg) {
	// muscle #, and elements -- left
	var muscles = svg.getElementById("left").children;
	params.nMuscles = muscles.length
	for (i=0; i<muscles.length; i++) {
		muscleElements.left.push(muscles[i]);
}
	muscleElements.left = muscleElements.left.reverse();
	// muscle elements -- right
	muscles = svg.getElementById("right").children;
	for (i=0; i<muscles.length; i++) {
		muscleElements.right.push(muscles[i]);
	}
	muscleElements.right = muscleElements.right.reverse();

	// levels + colors map
	var rects = svg.getElementById("cmap").children;
	params.nLevels = rects.length;
	params.colors = [];
	for (i=0; i<rects.length; i++) {
		var color = rects[i].getAttribute("fill").slice(1);
		params.colors.push(hexToRgb(color));
	}
	params.baseColor = svg.getElementById("outline").getAttribute("fill");
	params.baseColor = hexToRgb(params.baseColor.slice(1));

	// update initial state
	["left", "right"].map(function (side) {
		for (i=0; i<params.nMuscles; i++) {
			state.muscles[side].push(-1);
			muscleElements[side][i].setAttribute("fill", params.baseColor);
		}
	});
}

// helper functions to create event listeners
function makeOnClick(side, row, level) {
	return function() {
		var buttonRow = buttons[side][row];
		var muscleElement = muscleElements[side][row];
		var oldState = state.muscles[side][row];
		var color = params.colors[level];
		// turning off a row
		if (oldState == level) {
			buttonRow[level].style.background = addAlpha(color, 0.6);
			muscleElement.setAttribute("fill", params.baseColor);
			state.muscles[side][row] = -1;
		}
		// setting a new state
		else {
			// turn off old state
			if (oldState != -1) {
				buttonRow[oldState].style.background = "white";
			}
			buttonRow[level].style.background = color;
			muscleElement.setAttribute("fill", color);
			state.muscles[side][row] = level;
		}
	}
}

function makeMouseOver(side, row, level) {
	return function() {
		if (level != state.muscles[side][row]) {
			var button = buttons[side][row][level];
			var color = params.colors[level];
			button.style.background = addAlpha(color, 0.6);
		}
	}
}

function makeMouseOut(side, row, level) {
	return function() {
		if (level != state.muscles[side][row]) {
			var button = buttons[side][row][level];
			button.style.background = "white";
		}
	}
}

// create button banks and set up event listeners
function makeButtonBanks(svg) {
	var panels = {
		left: document.getElementById("leftButtonBank"),
		right: document.getElementById("rightButtonBank")
	};

	["left", "right"].map(function(side) {
		for (row=0; row<params.nMuscles; row++) {
			var panelRow = document.createElement("div");
			panelRow.className = "panelRow";
			panels[side].appendChild(panelRow);

			var buttonRow = document.createElement("div");
			buttonRow.className = "buttonRow " + side + "ButtonRow"; //e.g. class="buttonRow leftButtonRow"
			panelRow.appendChild(buttonRow);

			buttons[side].push([])
			for (level=0; level<params.nLevels; level++) {
				var button = document.createElement("button");
				button.className = "panelButton";
				button.innerHTML = level;
				button.style.background = "white";
				button.onclick = makeOnClick(side, row, level);
				button.onmouseover = makeMouseOver(side, row, level);
				button.onmouseout = makeMouseOut(side, row, level);
				buttonRow.appendChild(button);
				buttons[side][row].push(button);
			}

			var name = document.createElement("text");
			name.className = "name " + side + "Name";	//e.g. class="name leftName"
			name.innerHTML = parseName(muscleElements[side][row].id);
			panelRow.appendChild(name);
		}
	});
}

function makeMisc() {
	// make color map
	var cmap = document.getElementById("colorBar");
	cmap.id = "colorBar";
	for (i=0; i<params.nLevels; i++) {
		var c = document.createElement("div");
		c.className = "colorBox";
		c.innerHTML = i;
		c.style.background = params.colors[i];
		cmap.appendChild(c);
	}
}
