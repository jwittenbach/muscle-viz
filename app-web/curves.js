module.exports = Curves;

function Curves(shapes, colorMap) {
   this.shapes = shapes;
   this.colorMap = colorMap;
}

Curves.prototype.draw = function(canvas, colors) {

   var ctx = canvas.getContext("2d");
   var r = window.devicePixelRatio;
   ctx.setTransform(r, 0, 0, r, 0, 0);

   ctx.clearRect(0, 0, canvas.width, canvas.height);

   ctx.lineStyle = 'rgb(0,0,0)';
   ctx.lineWidth = "3";

   for (var i=0; i<this.shapes.length; i++) {

      ctx.fillStyle = this.colorMap[colors[i]];

      var shape = this.shapes[i];

      ctx.beginPath();
      var first=true;
      for (var j=0; j<shape.length; j++) {
         l = shape[j];
         if (l.line) {
            v = l.line;
            if (first) {
               ctx.moveTo(v[0], v[1]);
               first = false;
            }
            ctx.lineTo(v[2], v[3]);
         }
         else if (l.bezier) {
            v = l.bezier;
            if (first) {
               ctx.moveTo(v[0], v[1]);
               first = false;
            }
            ctx.bezierCurveTo(v[2], v[3], v[4], v[5], v[6], v[7]);
         }
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
   }
};

Curves.prototype.getShape = function() {
   var maxVals = new Array(2);

   // first pass applies offsets and computes maximum values
   this.shapes.forEach(function(strokes) {
      strokes.forEach(function(stroke) {
         if (stroke.hasOwnProperty('line')) var type = 'line';
         else if (stroke.hasOwnProperty('bezier')) var type = 'bezier';
         else return;
         for (var i=0; i<stroke[type].length; i++) {
            var idx = i%2
            var val = stroke[type][i];
            if (val > maxVals[idx] || maxVals[idx] === undefined) maxVals[idx] = val;
         }
      });
   });

   return maxVals;
}

Curves.prototype.reshape = function(kwargs) {

   kwargs = kwargs || {};
   if (kwargs.h === undefined) h = null;
   else h = kwargs.h;
   if (kwargs.w === undefined) w = null;
   else w = kwargs.w;
   if (kwargs.dx === undefined) dx = null;
   else dx = kwargs.dx;
   if (kwargs.dy === undefined) dy = null;
   else dy = kwargs.dy;

   if (w === null && h === null && dx === null && dy === null) {
      return;
   }
   else if (dx === null) dx = 0;
   else if (dy === null) dy = 0;

   // first pass applies offsets and computes maximum values
   var offsets = [dx, dy];
   this.shapes.forEach(function(strokes) {
      strokes.forEach(function(stroke) {
         if (stroke.hasOwnProperty('line')) var type = 'line';
         else if (stroke.hasOwnProperty('bezier')) var type = 'bezier';
         else return;
         for (var i=0; i<stroke[type].length; i++) {
            var idx = i%2;
            stroke[type][i] += offsets[idx];
         }
      });
   });

   // set height and width
   var maxVals = this.getShape();
   if (!(w !== null && h !== null)) {
      if (h === null) {
         h = (1.0*maxVals[1]/maxVals[0])*w;
      }
      else {
         w = (1.0*maxVals[0]/maxVals[1])*h;
      }
   }

   // second pass scales values
   var scales = [1.0*w/maxVals[0], 1.0*h/maxVals[1]];
   this.shapes.forEach(function(strokes) {
      strokes.forEach(function(stroke) {
         if (stroke.hasOwnProperty('line')) var type = 'line';
         else if (stroke.hasOwnProperty('bezier')) var type = 'bezier';
         else return;
         for (var i=0; i<stroke[type].length; i++) {
            var idx = i%2
            stroke[type][i] *= scales[idx];
         }
      });
   });
};
