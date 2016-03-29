//a couple of action types
var brush = "brush";
var line = "line";
var rectangle = "rectangle";
var eraser = "eraser";
var bucket = "bucket"

//record keepers
var numsteps = 0;
var steps = [];

//current stuff
var currColor;
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
	else if(tool === bucket) this.points.pop();
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
	var loc;
	if('touches' in e.originalEvent) loc = {x: e.originalEvent.touches[0].clientX, y: e.originalEvent.touches[0].clientY};
	else loc = {x: e.originalEvent.clientX, y: e.originalEvent.clientY};
	return {x: loc.x - that.offsetLeft, y: loc.y - that.offsetTop};
}

function rgbToHex(r, g, b)
{
	var hexed = "000000" + ((r*256*256) + (g*256) + b).toString(16);
	return hexed.substr(hexed.length - 6);
}

function getPixel(coords)
{
	return coords.y * context.canvas.width + coords.x;
}

function getColor(coords)
{
	//var imageData = context.getImageData(coords.x, coords.y, 1, 1);
	//var pixel = coords.y * context.canvas.width + coords.x;
	//var red = imageData.data[pixel];
	//var green = imageData.data[pixel+1];
	//var blue = imageData.data[pixel+2];
	//var alpha = imageData.data[pixel+3];
	var cl = context.getImageData(coords.x, coords.y, 1, 1).data;
	//console.log(cl);
	return ("#" + rgbToHex(cl[0], cl[1], cl[2]));
}

function getColor2(r, g, b)
{
	return ("#" + rgbToHex(r, g, b));
}

function pbucket(coords, targetCl, startup)
{
	if(targetCl != currColor)
	{
		var imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
		var Q = [];
		var processed = new Array(context.canvas.width * context.canvas.height).fill(false);
		var currPixel;
		var pixel;
		var up, down, left, right;
		Q.push(coords);
		processed[getPixel(coords)] = true;
		while(Q.length > 0)
		{
			currPixel = Q.shift(); //pop_front()
			console.log(currPixel);
			pixel = getPixel(currPixel);
			if(getColor2(imageData.data[pixel], imageData.data[pixel + 1], imageData.data[pixel + 2]) == targetCl)
			{
				if(startup != true) steps[numsteps-1].points.push(coords);
				context.fillRect(coords.x, coords.y, 1, 1);
				up = {x:currPixel.x, y:currPixel.y-1};
				down = {x:currPixel.x, y:currPixel.y+1};
				left = {x:currPixel.x-1, y:currPixel.y};
				right = {x:currPixel.x+1, y:currPixel.y};

				if(!processed[getPixel(right)] && currPixel.x < context.canvas.width) Q.push(right);
				if(!processed[getPixel(left)] && currPixel.x > 0) Q.push(left);
				if(!processed[getPixel(down)] && currPixel.y < context.canvas.height) Q.push(down);
				if(!processed[getPixel(up)] && currPixel.y > 0) Q.push(up);

				processed[getPixel(up)] = true;
				processed[getPixel(down)] = true;
				processed[getPixel(left)] = true;
				processed[getPixel(right)] = true;
			}
		}
	}
}

/*
function pbucket(coords, color)
{
	var cl = getColor(coords);
	if(cl === color && color != currColor)
	{
		steps[numsteps-1].points.push(coords);
		context.fillRect(coords.x, coords.y, 1, 1);
		if(coords.x > 0)pbucket({x:coords.x - 1,y:coords.y},color);
		if(coords.x < context.canvas.width)pbucket({x:coords.x + 1,y:coords.y},color);
		if(coords.y > 0)pbucket({x:coords.x,y:coords.y - 1},color);
		if(coords.y < context.canvas.height)pbucket({x:coords.x,y:coords.y + 1},color);
	}
}
*/

////////////////////////////////////////////////////////////////////////////////////////////

$(document).ready(function(){
	context = document.getElementById('paintML5').getContext("2d");
	//currColor = "#FFFFFF";
	//pbucket({x:0, y:0}, "000000", true);
	//currColor = "#000000"
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
	//console.log(mouse);
	//clean up steps if this step is after a series of undos
	while(steps.length > numsteps) steps.pop();
	//increase number of steps by 1
	numsteps++;
	//add this step to the array
	steps.push(new Tool(currSize, currColor, currTool, mouse));
	mouseisdown = true;
	
	redraw();
	
	if(steps[numsteps-1].tool == bucket)
	{
		context.fillStyle = currColor;
		console.log(getColor(mouse));
		pbucket(mouse, getColor(mouse));
	}
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
		context.fillStyle = steps[i].color;
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
		else if(steps[i].tool == bucket)
		{
			for(var j=0; j<steps[i].points.length; j++)
					context.fillRect(steps[i].points[j].x, steps[i].points[j].y, 1, 1);
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
