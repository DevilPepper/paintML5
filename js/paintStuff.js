var paintContext = document.getElementById('paintML5').getContext("2d");
var stroke = false;
var purple = "#cb3594";
var green = "#659b41";
var yellow = "#ffcf33";
var brown = "#986928";
var curColor = purple;
var curSize = "normal";
var curTool = "brush";
var clickTool = new Array();
var clickSize = new Array();
var clickColor = new Array();
var xs = new Array();
var ys = new Array();
var drags = new Array();

$(document).ready(function(){
	$("#purple").css('background-color', purple);
	$("#green").css('background-color', green);
	$("#yellow").css('background-color', yellow);
	$("#brown").css('background-color', brown);
});

$(".colors div").on('click', function(e){
	curColor = $(this).css('background-color');
});

$(".sizes a").on('click', function(e){
	curSize = $(this).attr('id');
	//console.log($(this).id);
	//console.log(curSize);
});

$(".tools a").on('click', function(e){
	curTool = $(this).attr('id');
});

$('#paintML5').on('mousedown mousemove', function(e){
	//get mouse click position
	var x = e.pageX - this.offsetLeft;
	var y = e.pageY - this.offsetTop;
	
	if(stroke){
		addClick(x, y, true);
	}
	else
	{
		if(e.type == "mousedown") stroke = true;
		addClick(x, y, false);
	}
	redraw();
});

$('#paintML5').on('mouseup mouseleave', function(e){
	stroke = false;
});

function addClick(x, y, dragging)
{
	xs.push(x);
	ys.push(y);
	drags.push(dragging);
	if(curTool == "eraser") clickColor.push("#FFFFFF");
	else clickColor.push(curColor);
  	clickSize.push(curSize);
}

function redraw(){
  paintContext.clearRect(0, 0, paintContext.canvas.width, paintContext.canvas.height); // Clears the canvas
  
  paintContext.lineJoin = "round";
  //paintContext.lineWidth = 5;
			
	for(var i=0; i < xs.length; i++){		
		paintContext.beginPath();
		if(drags[i] && i)
		{
			paintContext.moveTo(xs[i-1], ys[i-1]);
		}
		else
		{
			paintContext.moveTo(xs[i], ys[i]);
		}
		paintContext.lineTo(xs[i], ys[i]);
		paintContext.strokeStyle = clickColor[i];
		paintContext.lineWidth = clickSize[i];
		paintContext.closePath();
		paintContext.stroke();
	}
}
