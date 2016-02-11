framework.init(1500, 750);

var button = new framework.ImageAsset('buttons-01.png');
var text = new framework.JSONAsset('muscles.json');
var shapes = new framework.JSONAsset('shapes.json');

var pic = new framework.Picture(200, 100, button, {w:30, h:30});

var text1 = new framework.Text(100, 500, "Hello", {"size":40});
var text2 = new framework.TextFromJSON(100, 100, text, 3, {"size":30})

var curves = new framework.Curves(300, 100, shapes, {dx:-375, dy:560, w:200, h:200, lineWidth:10});

var clickable = new framework.Interactable(300, 100, {w:200, h:200});


var img0 = new framework.ImageAsset('buttons-06.png');
var img1 = new framework.ImageAsset('buttons-07.png');
var button2 = new framework.Button2(400, 400, img0, img1, {height:200, width:100});

var nLevels = 5;
var images0 = new Array(nLevels);
var images1 = new Array(nLevels);
function leadingZeros(integer, nDigits) {
	s = integer.toString();
	return "0".repeat(nDigits-s.length) + s;
}
for (var i=0; i<nLevels; i++) {
	images0[i] = new framework.ImageAsset("buttons-" + leadingZeros(i+1, 2) + ".png");
	images1[i] = new framework.ImageAsset("buttons-" + leadingZeros(nLevels+i+1, 2) + ".png");
}

var panel = new framework.ButtonPanel(500, 100, images0, images1, {h:30, dw:-2});
panel.onChange = function() {
   console.log(this.selected);
};
