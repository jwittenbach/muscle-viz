framework = {

    init: function(width, height, element) {
        // create canvas and attach to body
        var canvas = document.createElement("canvas")

        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        canvas.setAttribute("style", "border: 2px solid")

        element.appendChild(canvas);

        this.ctx = canvas.getContext("2d");
    },

    draw_image: function(name) {
        var img = new Image();
        var context = this.ctx;

        img.onload = function() {
            context.drawImage(img, 0, 0);
        }

        img.src = name
    }

}