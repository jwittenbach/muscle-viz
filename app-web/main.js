var params = {};

var muscleElements = {
	left: [],
	right: []
};

var buttons = {
	main: {
		left: [],
		right: []
	},
	pm: {
		left: [],
		right: []
	},
	show: []
};

var state = {
	muscles: {
		main: {
			left: [],
			right: []
		},
		pm: {
			left: [],
			right: []
		},
		show: [] // no left/right, both muscles in a pair are on/off together

	},
	metadata: {
		name: "",
		age: "",
		sex: "",
		date: "",
		diagnosis: "",
		notes: ""
	}
}

// load SVG file with image
var xhr = new XMLHttpRequest();
xhr.open("GET", "muscle-outline.svg", true);
xhr.overrideMimeType("image/svg+xml");
xhr.send();
xhr.onload = function(e) {
	svg = document.getElementById("centerPanel").appendChild(xhr.responseXML.documentElement);
	svg.id = "body";
	svg.setAttribute("height", "700px");
	setParamsFromSVG(svg);
	makeButtonBanks(svg);
	makeMisc();
	makeConfig();
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

	// sort and rename muscle elements
	var order = [];
	for (i=0; i<muscles.length; i++) {
		var fullName = muscleElements.left[i].id;
		var idx = fullName.indexOf('_');
		var num = fullName.slice(1, idx);
		var name = fullName.slice(idx+1);
		order.push(parseInt(num)-1); //labeling in SVG is 1-based
		muscleElements.left[i].id = name;
	}
	["left", "right"].map(function (side) {
		var ordered = [];
		for (i=0; i<muscles.length; i++) {
			var idx = order.indexOf(i);
			ordered.push(muscleElements[side][idx]);
		}
		muscleElements[side] = ordered;
	});

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
			state.muscles.main[side].push(-1);
			state.muscles.pm[side].push(-1);
			muscleElements[side][i].setAttribute("fill", params.baseColor);
		}
	});
	for (i=0; i<muscles.length; i++) {
		state.muscles.show.push(true)
	}
}

// actions
function setMuscle(side, row, level) {
	var oldState = state.muscles.main[side][row];
	if (oldState != level) {
		var buttonRow = buttons.main[side][row];
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
		state.muscles.main[side][row] = level;
	}
}

function setMusclePM(side, row, pm) {
	var oldState = state.muscles.pm[side][row];
	if (oldState != pm) {
		var buttonRow = buttons.pm[side][row];
		 if (pm == -1) {
			 buttonRow[oldState].style.background = "white";
		 }
		 else {
			 buttonRow[pm].style.background = "black";
			 buttonRow[pm].style.color = "white";
			 if (oldState != -1) {
				 buttonRow[oldState].style.background = "white";
			 }
		 }
		 if (oldState != -1) {
			 buttonRow[oldState].style.color = "black";
		 }
		 state.muscles.pm[side][row] = pm;
	}
}

function setMuscleDisplay(row, flag) {
	if (flag) {
		muscleElements.left[row].style.display = "block";
		muscleElements.right[row].style.display = "block";
		buttons.show[row].style.background = "#999999";
	}
	else {
		buttons.show[row].style.background = "white";
		muscleElements.left[row].style.display = "none";
		muscleElements.right[row].style.display = "none";
	}
}

function setFullStrength() {
	["left", "right"].map(function(side) {
		for (i=0; i<params.nMuscles; i++) {
				if (state.muscles.main[side][i] == -1) {
					setMuscle(side, i, params.nLevels-1);
				}
		}
	});
}

function setNoStrength() {
	["left", "right"].map(function(side) {
		for (i=0; i<params.nMuscles; i++) {
			setMuscle(side, i, -1);
            setMusclePM(side, i, -1);
		}
	});
}

function setFromState(newState) {
	["left", "right"].map(function(side) {
		for (i=0; i<params.nMuscles; i++) {
			setMuscle(side, i, newState.muscles.main[side][i]);
			setMusclePM(side, i, newState.muscles.pm[side][i]);
		}
	});
	for (i=0; i<params.nMuscles; i++) {
		setMuscleDisplay(i, newState.muscles.show[i]);
	}
	for (name in newState.metadata) {
		var el = document.getElementById(name);
		el.value = newState.metadata[name];
	}
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
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 4));
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

function toConfig() {
	var el = document.getElementById("mainView");
	el.style.display = "none";
	el = document.getElementById("configView");
	el.style.display = "";
}

function setMetadata() {
	var els = document.getElementsByTagName("textarea");
	for (i=0; i<els.length; i++) {
		state.metadata[els[i].id] = els[i].value;
	}
	var el = document.getElementById("annotationView");
	el.style.display = "none";
	el = document.getElementById("mainView");
	el.style.display = "";
}

function setConfig() {
	var el = document.getElementById("configView");
	el.style.display = "none";
	el = document.getElementById("mainView");
	el.style.display = ""
}

// helper functions to create event listeners
function makeOnClickNum(side, row, level) {
	return function() {
		var oldState = state.muscles.main[side][row];
		// turning off the muscle
		if (oldState == level) {
			setMuscle(side, row, -1);
		}
		else {
			setMuscle(side, row, level);
		}
	}
}

function makeOnClickSelect(row) {
	return function() {
		var newState = !state.muscles.show[row];
		setMuscleDisplay(row, newState)
		state.muscles.show[row] = newState
	}
}

function makeMouseOverNum(side, row, level) {
	return function() {
		if (level != state.muscles.main[side][row]) {
			var button = buttons.main[side][row][level];
			var color = params.colors[level];
			button.style.background = addAlpha(color, 0.6);
		}
	}
}

function makeMouseOutNum(side, row, level) {
	return function() {
		if (level != state.muscles.main[side][row]) {
			var button = buttons.main[side][row][level];
			button.style.background = "white";
		}
	}
}

function makeOnClickPM(side, row, pm) {
	return function() {
		var oldState = state.muscles.pm[side][row];
		// turning off the muscle
		if (oldState == pm) {
			setMusclePM(side, row, -1);
		}
		else {
			setMusclePM(side, row, pm);
		}
	}
}

function makeMouseOverPM(side, row, pm) {
	return function() {
		if (pm != state.muscles.pm[side][row]) {
			var button = buttons.pm[side][row][pm];
			button.style.background = '#BBBBBB';
		}
	}
}

function makeMouseOutPM(side, row, pm) {
	return function() {
		if (pm != state.muscles.pm[side][row]) {
			var button = buttons.pm[side][row][pm];
			button.style.background = "white";
		}
	}
}

// create button banks and set up event listeners
function makeButtonBanks(svg) {
	var panels = {
		//NB: left/right switched because the left panel
		//		maps to muscles on the right side of the patient's body
		//		and vice-versa
		left: document.getElementById("rightButtonBank"),
		right: document.getElementById("leftButtonBank")
	};

	["left", "right"].map(function(side) {
		for (row=0; row<params.nMuscles; row++) {
			var bankRow = document.createElement("div");
			bankRow.className = "bankRow";
			panels[side].appendChild(bankRow);

			var buttonRow = document.createElement("div");
			buttonRow.className = "buttonRow " + side + "ButtonRow"; //e.g. class="buttonRow leftButtonRow"

			var minus = document.createElement("button");
			minus.className = "plusMinus bankButton";
			minus.innerHTML = "-";
			minus.onclick = makeOnClickPM(side, row, 0);
			minus.onmouseover = makeMouseOverPM(side, row, 0);
			minus.onmouseout = makeMouseOutPM(side, row, 0);
			buttonRow.appendChild(minus)

			var numberRow = document.createElement("div");
			numberRow.className = "numberRow";
			buttonRow.appendChild(numberRow);

			buttons.main[side].push([])
			for (level=0; level<params.nLevels; level++) {
				var button = document.createElement("button");
				button.className = "number bankButton";
				button.innerHTML = level;
				button.onclick = makeOnClickNum(side, row, level);
				button.onmouseover = makeMouseOverNum(side, row, level);
				button.onmouseout = makeMouseOutNum(side, row, level);
				numberRow.appendChild(button);
				buttons.main[side][row].push(button);
			}

			var plus = document.createElement("button");
			plus.className = "plusMinus bankButton";
			plus.innerHTML = "+";
			plus.onclick = makeOnClickPM(side, row, 1)
			plus.onmouseover = makeMouseOverPM(side, row, 1);
			plus.onmouseout = makeMouseOutPM(side, row, 1);
			buttonRow.appendChild(plus);
			buttons.pm[side].push([minus, plus]);

			var name = document.createElement("text");
			name.className = "name";
			name.innerHTML = parseName(muscleElements[side][row].id);

			if (side === "left") {
				bankRow.appendChild(buttonRow);
				bankRow.appendChild(name);
			}
			else {
				bankRow.appendChild(name);
				bankRow.appendChild(buttonRow);
			}
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

function makeConfig() {
	var panel = document.getElementById("selectPanel")
	for (row=0; row<params.nMuscles; row++) {

		var bankRow = document.createElement("div");
		bankRow.className = "bankRow";
		panel.appendChild(bankRow);

		var button = document.createElement("button")
		button.className = "selectButton";
		button.onclick = makeOnClickSelect(row);
		bankRow.appendChild(button);
		buttons.show.push(button);

		var name = document.createElement("text");
		console.log(name);
		name.innerHTML = parseName(muscleElements.left[row].id);
		bankRow.append(name);
	}

}
