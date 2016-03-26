//a couple of action types
var brush = "brush";
var line = "line";
var rectangle = "rectangle";
var eraser = "eraser";

//record keepers
var numsteps = 0;
var steps = [];

//current stuff
var currColor = "#000000";
var currSize = 5;
var currTool = brush;
var mouseisdown = false;

var context;

////////////////////////////////////////////////////////////////////////////////////////////

//A brush stroke is made up of a set of points along it's path, a color and a size.
//Geometry (i.e. line and rectangle) should be made up of end points.
var Tool = function (size, color, tool, start){
	this.tool = tool;
	this.size = size;
	if(tool === eraser)
		this.color = "#FFFFFF";
	else
		this.color = color;
	this.points = [start];
	//start the shape with start and end points at the start.
	if(tool === rectangle || tool === line) this.points.push(start);
};
Tool.prototype.constructor = Tool;
//add points to the stroke to make it longer
Tool.prototype.addPoint = function (point)
{
	this.points.push(point);
};
//remove the old end point and add a new one, adjusting the size of the shape.
Tool.prototype.setEndPoint = function (point)
{
	this.points.pop();
	this.points.push(point);
}

////////////////////////////////////////////////////////////////////////////////////////////

//Get the mouse's coordinates reletive to the mouse
function getMousePos(e, that)
{
	return {x: e.pageX - that.offsetLeft, y: e.pageY - that.offsetTop};
}

////////////////////////////////////////////////////////////////////////////////////////////

$(document).ready(function(){
	context = document.getElementById('paintML5').getContext("2d");
});

////////////////////////////////////////////////////////////////////////////////////////////

$("#colorpicker").on('change', function(e){
	currColor = $(this).val();
});

$("#sizer").on('change', function(e){
	currSize = $(this).val();
	//console.log($(this).id);
	//console.log(curSize);
});

$(".tools a").on('click', function(e){
	currTool = $(this).attr('id');
});

//decreases number of steps by 1, effectively undoing the last step. Preserves the last step in case of a redo
$("#undo").on('click', function(e){
	if(numsteps > 0) numsteps--;
	redraw();
});

//increases number of steps by 1, effectively redoing
$("#redo").on('click', function(e){
	if(numsteps < steps.length) numsteps++;
	redraw();
});

////////////////////////////////////////////////////////////////////////////////////////////

$('#paintML5').on('mousemove touchmove', function(e){
	//get mouse click position
	var mouse = getMousePos(e, this);
	if(mouseisdown)
	{
		//lines and rectangles only need 2 points
		if(steps[numsteps-1].tool === rectangle || steps[numsteps-1].tool === line)
			steps[numsteps-1].setEndPoint(mouse);
		else
			//everything else has an array of points.
			steps[numsteps-1].addPoint(mouse);
	}
	redraw();
});

$('#paintML5').on('mousedown touchstart', function(e){
	var mouse = getMousePos(e, this);
	//clean up steps if this step is after a series of undos
	while(steps.length > numsteps) steps.pop();
	//increase number of steps by 1
	numsteps++;
	//add this step to the array
	steps.push(new Tool(currSize, currColor, currTool, mouse));
	mouseisdown = true;
	redraw();
});

$('#paintML5').on('mouseup mouseleave touchend', function(e){
	mouseisdown = false;
});

////////////////////////////////////////////////////////////////////////////////////////////


function redraw(){
	context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas

	context.lineJoin = "round";
	//start and end coordinates
	var coordStart;
	var coordEnd;

	//draw every step except undone steps
	for(var i=0; i < numsteps; i++){
		//set the color and width of this path
		context.strokeStyle = steps[i].color;
		context.lineWidth = steps[i].size;
		
		//if this is a rectangle use context.rect to draw it
		if(steps[i].tool == rectangle)
		{
			context.beginPath();
			coordStart = steps[i].points[0];
			coordEnd = steps[i].points[1];
			context.rect(coordStart.x, coordStart.y, (coordEnd.x-coordStart.x), (coordEnd.y-coordStart.y));
			context.closePath();
			context.stroke();
		}
		//otherwise, draw all of the \delta lines
		else
		{
			for(var j=0; j<steps[i].points.length; j++)
			{
				context.beginPath();
				coordEnd = steps[i].points[j];
				if(j>0)
				{
					coordStart = steps[i].points[j-1];
				}
				else
				{
					coordStart = coordEnd;
				}

				context.moveTo(coordStart.x, coordStart.y);
				context.lineTo(coordEnd.x, coordEnd.y);
				context.closePath();
				context.stroke();
			}
		}
	}
}
