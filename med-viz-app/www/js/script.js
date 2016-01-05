// globals
var canvasMain; var canvasLegend;
var ctxMain; var ctxLegend
var shapes;
var names;

var nMuscles = 26;
var nShapes = nMuscles+1;

var nLevels = 6
var nColors = nLevels + 1;
var colorMap = ['rgb(240,240,240)','rgb(165,0,38)','rgb(244,109,67)','rgb(254,224,144)',
                'rgb(224,243,248)','rgb(116,173,209)','rgb(49,54,149)'];
var levels = ['0', '1', '2', '3', '4', '5']

var colors = new Array(nShapes);
for (var i=0; i<nShapes; i++) {
    colors[i] = 0;
}

var init = function() {

    // set up the canvases/contexts
    canvasMain = document.getElementById("canvas-main");
    canvasLegend = document.getElementById("canvas-legend");

    ctxMain = canvasMain.getContext("2d");
    ctxLegend = canvasLegend.getContext("2d");

    // load names and make buttons
    loadAndButtons();

    // read json file with art information
    loadAndDraw();

    // draw the legend
    drawLegend();

}

var updateColors = function(that) {
    muscle = parseInt(that.id.substring(6, that.id.length));
    colors[muscle+1] = that.value;
    drawShapes();
}

var makeButtonPanel = function(element, startId, nButtons) {
    var buttonString = '';
    buttonString += '<ul style="list-style-type: none">\n';
    for (var i=startId; i<startId+nButtons; i++) {
        if (element==='lbuttons') {
            name = names[i];
        }
        else {
            name = names[i-nMuscles/2];
        }
        buttonString += '<li style="overflow: hidden">' + name;
        buttonString += '<select id=muscle' + i + ' onchange="updateColors(this)" style="float: right">';
        buttonString += '<option value="0"></option>\n';
        for (var j=0; j<nLevels; j++) {
            option = j+1;
            label = j;
            buttonString += '<option value="' + option + '">' + label + '</option>';
        }
        buttonString += '</li>';
        buttonString += '</select>';
    }
    buttonString += '</ul>\n';

    document.getElementById(element).innerHTML = buttonString;
}

var makeButtons = function() {
    makeButtonPanel('lbuttons', 0, nMuscles/2);
    makeButtonPanel('rbuttons', nMuscles/2, nMuscles/2)
}

var loadAndButtons = function() {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && (xmlhttp.status == 200 || xmlhttp.status == 0)) {
            names = JSON.parse(xmlhttp.responseText);
            makeButtons();
        }
    }

    xmlhttp.open("GET", "muscles.json", true);
    xmlhttp.send();
}

var loadAndDraw = function() {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200 || xmlhttp.status == 0) {
            shapes = JSON.parse(xmlhttp.responseText);
            drawShapes();
        }
    }

    xmlhttp.open("GET", 'shapes.json', true);
    xmlhttp.send();
}

var drawShapes = function() {

    // clear the canvas
    ctxMain.clearRect(0, 0, canvasMain.width, canvasMain.height);

    // draw all shapes
    for (var i=0; i<nShapes; i++) {
        drawShape(shapes[i], colorMap[colors[i]], ctxMain);
    }
}

var drawShape = function(shape, color, ctx) {

    // line/fill properties
    ctx.fillStyle=color;
    ctx.lineStyle="rgb(0,0,0)";
    ctx.lineWidth=2;

    // draw line elements
    dx = -375;
    dy = 575;
    ctx.beginPath();
    var first = true;
    for (var i=0; i<shape.length; i++) {
        l = shape[i];
        if (l.line) {
            v = l.line;
            if (first) {
                ctx.moveTo(dx+v[0], dy+v[1]);
                first = false;
            }
            ctx.lineTo(dx+v[2], dy+v[3]);
        }
        else if (l.bezier) {
            v = l.bezier;
            if (first) {
                ctx.moveTo(dx+v[0], dy+v[1]);
                first = false;
            }
            ctx.bezierCurveTo(dx+v[2], dy+v[3], dx+v[4], dy+v[5], dx+v[6], dy+v[7]);
        }
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}

var drawLegend = function() {

    ctxLegend.clearRect(0, 0, canvasLegend.width, canvasLegend.height);

    boxWidth = 1.0*canvasLegend.width/3;
    boxHeight = 1.0*canvasLegend.height/nColors;
    boxX = 1.3*boxWidth

    textX = boxX - boxWidth/1.7;
    textY = boxHeight/1.3;

    ctxLegend.font = "17px Arial";

    for (var i=0; i<nLevels; i++) {

        ctxLegend.fillStyle = colorMap[i+1];
        ctxLegend.fillRect(boxX, i*boxHeight, boxWidth, boxHeight);

        ctxLegend.fillStyle = "rgb(0, 0, 0)";
        ctxLegend.fillText(i, textX, i*boxHeight+textY)
    }
}

var fullStrength = function() {

    for (var i=0; i<nMuscles; i++) {
        colors[i+1] = nLevels;
        var button = document.getElementById("muscle" + i);
        button.value = nLevels;
    }

    drawShapes();
}

var setColorMap = function() {

    var R1 = document.getElementById("R1").value;
    var G1 = document.getElementById("G1").value;
    var B1 = document.getElementById("B1").value;
    var c1 = new Array(3);
    c1[0] = parseFloat(R1); c1[1] = parseFloat(G1); c1[2] = parseFloat(B1);

    var R2 = document.getElementById("R2").value;
    var G2 = document.getElementById("G2").value;
    var B2 = document.getElementById("B2").value;
    var c2 = new Array(3);
    c2[0] = parseFloat(R2); c2[1] = parseFloat(G2); c2[2] = parseFloat(B2);

    num = document.getElementById("num").value;

    var d = new Array(3)
    for (var i=0; i<3; i++) {
        d[i] = 1.0*(c2[i] - c1[i])/(num-1);
    }

    c = new Array(num);
    for (var i=0; i<num; i++) {
        c[i] = new Array(3);
    }

    for (var i=0; i<num; i++) {
        for (var j=0; j<3; j++) {
            c[i][j] = parseInt(c1[j] + i*d[j]);
        }
    }

    var newColors = new Array(num+1);
    newColors[0] = "rgb(245, 245, 245)";
    for (var i=0; i<num; i++) {
        newColors[i+1] = "rgb(" + c[i][0] + ", " + c[i][1] + ", " + c[i][2] + ")";
    }

    colorMap = newColors;

    if (nColors != num) {
        nColors = num;
        for (var i=0; i<nMuscles+1; i++) {
            colors[i] = 0;
            makeButtons();
        }
    }

    drawShapes();
    drawLegend();
}
