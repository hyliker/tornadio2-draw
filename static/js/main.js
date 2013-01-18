var app = {
  socket: null,
  canvas: null, 
  strokeStyle: '#'+Math.floor(Math.random()*16777215).toString(16),
  init: function () {
    var socket = io.connect();
    app.socket = socket;

    socket.on("connect", function () {
      app.log("socket connected");
    });

    socket.on("online", function (number) {
        app.log(number +  " online users");

    });

    socket.on("disconnect", function () {
      app.log("socket disconnect");
    });

    socket.on("message", function (message) {
      app.log(message);
    });

    socket.on("clear", function () {
      console.log(app.canvas);
      app.clear();
    });

    socket.on("draw", function (message) {
        var drawData = JSON.parse(message);
        app.draw(drawData);
    });

    $(window).on('beforeunload',function(){ app.socket.disconnect(); });

    var isMouseDown = false;
    var mouseX, mouseY, moveToPos, lineToPos;

    var canvas = app.canvas = $("#canvas").get(0);

    canvas.width = window.screen.width;
    canvas.height = window.screen.height;

    $("#canvas").mousedown(function (evt) {
        isMouseDown = true;
        mouseX = evt.pageX - this.offsetLeft;
        mouseY = evt.pageY - this.offsetTop;
        moveToPos = {x: mouseX, y: mouseY};
    });

    $("#canvas").mouseup(function (evt) {
        isMouseDown = false;
    });

    $("#canvas").mouseout(function (evt) {
        isMouseDown = false;
    });

    $("#canvas").mousemove(function (evt) {
        if (isMouseDown) {
          mouseX = evt.pageX - this.offsetLeft;
          mouseY = evt.pageY - this.offsetTop;
          lineToPos = {x: mouseX, y: mouseY};
          app.draw({moveToPos: moveToPos, lineToPos: lineToPos, strokeStyle: app.strokeStyle}, true);
          moveToPos = lineToPos;
        }
    });

    $("#clear").click(function (evt) {
        socket.emit("clear");
        app.clear();
    });

  },
  log: function (message) {
    $("#debug-bar").html(message);
  },
  clear: function () {
      var ctx = app.canvas.getContext("2d");
      ctx.clearRect(0, 0, app.canvas.width, app.canvas.height);
  },
  draw: function (drawData, emit) {
    var moveToPos = drawData.moveToPos;
    var lineToPos = drawData.lineToPos;
    var strokeStyle = drawData.strokeStyle;

    var ctx = app.canvas.getContext("2d");
    ctx.strokeStyle = strokeStyle;
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(moveToPos.x, moveToPos.y);
    ctx.lineTo(lineToPos.x, lineToPos.y);
    ctx.closePath();
    ctx.stroke();

    if (emit) {
      var drawMessage = JSON.stringify({moveToPos: moveToPos, lineToPos: lineToPos, strokeStyle: strokeStyle});
      app.socket.emit("draw", drawMessage);
    }
  }
};
_.bindAll(app);

$(function () {
    app.init();
});
