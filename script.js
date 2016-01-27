framework.init(500, 750);

var button = new framework.ImageAsset('buttons-01.png');
var text = new framework.JSONAsset('muscles.json');

var pic = new framework.Picture(100, 200, button, {w:20, h:20});

var text1 = new framework.Text(100, 200, "Hello", {"size":20});
var text2 = new framework.TextFromJSON(100, 300, text, 3, {"size":50})
