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

// actions
function setMuscle(side, row, level) {
	var oldState = state.muscles[side][row];
	if (oldState != level) {
		var buttonRow = buttons[side][row];
		var muscleElement = muscleElements[side][row];
		if (level == -1) {
			buttonRow[oldState].style.background = "white";
			muscleElement.setAttribute("fill", params.baseColor);
		}
		else {
			var color = params.colors[level];
			buttonRow[level].style.background = color;
			buttonRow[level].style.color = "white";
			muscleElement.setAttribute("fill", color);
			if (oldState != -1) {
				buttonRow[oldState].style.background = "white";
			}
		}
		if (oldState != -1) {
			buttonRow[oldState].style.color = "black";
		}
		state.muscles[side][row] = level;
	}
}

function setFullStrength() {
	["left", "right"].map(function(side) {
		for (i=0; i<params.nMuscles; i++) {
				if (state.muscles[side][i] == -1) {
					setMuscle(side, i, params.nLevels-1);
				}
		}
	});
}

function setNoStrength() {
	["left", "right"].map(function(side) {
		for (i=0; i<params.nMuscles; i++) {
			setMuscle(side, i, -1);
		}
	});
}

function setFromState(newState) {
	["left", "right"].map(function(side) {
		for (i=0; i<params.nMuscles; i++) {
			setMuscle(side, i, newState.muscles[side][i]);
		}
	});
	state = newState;
}

function download(data, defaultName) {
	// get filename
	var filename = prompt("filename:", defaultName);
	if (filename === null) {
		return;
	}

	// download
	var element = document.createElement('a');
	element.setAttribute('href', data);
	element.setAttribute('download', filename);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

function saveData() {
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
	download(dataStr, "data.json");
}

function loadData() {
	var element = document.createElement("input");
	element.setAttribute("type", "file");
	element.style.display = 'none';
	document.body.appendChild(element);
	element.onchange = function(e) {
		var reader = new FileReader();
		reader.onload = function(e) {
			setFromState(JSON.parse(reader.result));
		}
		reader.readAsText(element.files[0]);
		document.body.removeChild(element);
	}
	element.click();
}

function saveSVG() {
	var data = document.getElementById("centerPanel").innerHTML;
	var dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(data);
	download(dataStr, "image.svg");
}

function toAnnotation() {
	var el = document.getElementById("mainView");
	el.style.display = "none";
	el = document.getElementById("annotationView");
	el.style.display = "";
}

// helper functions to create event listeners
function makeOnClick(side, row, level) {
	return function() {
		var oldState = state.muscles[side][row];
		// turning off the muscle
		if (oldState == level) {
			setMuscle(side, row, -1);
		}
		else {
			setMuscle(side, row, level);
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
