framework.init(750, 750);

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
var button2 = new framework.Button2(400, 400, img0, img1);
