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
	//else if(tool === bucket) this.points.pop();
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
//returns whether or not the coordinate is already on the list
Tool.prototype.redundant = function (point)
{
	var found = false;
	for(var i=0; i<this.points.length && !found; i++) found |= ((this.points[i].x == point.x) && (this.points[i].y == point.y));
	return found;
}

////////////////////////////////////////////////////////////////////////////////////////////

function copylog(log)
{
	console.log(log);
	return log;
}

//Get the mouse's coordinates reletive to the mouse
function getMousePos(e, that)
{
	var loc;
	if('touches' in e.originalEvent) loc = {x: e.originalEvent.touches[0].clientX, y: e.originalEvent.touches[0].clientY};
	else loc = {x: e.originalEvent.clientX, y: e.originalEvent.clientY};
	return {x: Math.floor(loc.x - that.offsetLeft), y: Math.floor(loc.y - that.offsetTop)};
}

function rgbToHex(r, g, b)
{
	var hexed = "000000" + ((r<<16) + (g<<8) + b).toString(16);
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

function getCL(color)
{
	var cL = parseInt(color.substr(1), 16);
	return [((cL >> 16) & 0xFF), ((cL >> 8) & 0xFF), (cL & 0xFF), 0xFF];
}

//function pbucket(coords)
function pbucket(step)
{
	var imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
	//var targetCl = getPixel(coords)*4;
	var targetCl = getPixel(step.points[0])*4;

	//var newCL = getCL(currColor);
	var newCL = getCL(step.color);
	var tarCL = [imageData.data[targetCl],imageData.data[targetCl+1],imageData.data[targetCl+2],imageData.data[targetCl+3]];
	
	if(tarCL[0] != newCL[0] && tarCL[1] != newCL[1] && tarCL[2] != newCL[2] || tarCL[3] != newCL[3])
	{
		var Q = [];
		var currPixel, popped;
		var pixel;
		var up, down;//, left, right;
		var upper, lower, next;
		//console.log(currColor);
		//console.log(targetCl);
		//console.log(newCL);
		//context.fillStyle = currColor;
				
		//push coords to stack/queue (Q)
		//
		Q.push(step.points[0]);
		//while Q not empty
		while(Q.length > 0)
		{
			//pop from queue
			popped = Q.shift(); //pop_front()
			currPixel = {x: popped.x, y: popped.y, base: getPixel(popped)*4};
			//console.log(currPixel);
			upper = lower = false;

			//navigate to leftmost boundary
			while(currPixel.x >= 0 && imageData.data[currPixel.base] == tarCL[0] && imageData.data[currPixel.base+1] == tarCL[1] && imageData.data[currPixel.base+2] == tarCL[2])// && imageData.data[currPixel.base+3] == tarCL[3])
					//getColor2(imageData.data[currPixel.base], imageData.data[currPixel.base + 1], imageData.data[currPixel.base + 2]) == targetCl)
			{
				currPixel.x--;
				currPixel.base = getPixel(currPixel) * 4;
				//console.log(currPixel);
			}
			if(currPixel.x < popped.x)
			{
				currPixel.x++;
				currPixel.base = getPixel(currPixel) * 4;
			}
			//console.log(currPixel);
			
			//while not at rightmost boundary and color is target color
			while(currPixel.x < context.canvas.width && imageData.data[currPixel.base] == tarCL[0] && imageData.data[currPixel.base+1] == tarCL[1] && imageData.data[currPixel.base+2] == tarCL[2])// && imageData.data[currPixel.base+3] == tarCL[3])
					//getColor2(imageData.data[currPixel.base], imageData.data[currPixel.base + 1], imageData.data[currPixel.base + 2]) == targetCl)
			{
				//paint
				//next = 
				//console.log([currPixel, "pre"]);
				//console.log([imageData.data[currPixel.base],imageData.data[currPixel.base+1],imageData.data[currPixel.base+2],imageData.data[currPixel.base+3]]);
				//steps[numsteps-1].points.push(coords);
				//if(!steps[numsteps-1].redundant(currPixel))steps[numsteps-1].addPoint(currPixel);
				imageData.data[currPixel.base] = newCL[0];
				imageData.data[currPixel.base+1] = newCL[1];
				imageData.data[currPixel.base+2] = newCL[2];
				imageData.data[currPixel.base+3] = newCL[3];

				//console.log([currPixel, "post"]);
				//console.log([imageData.data[currPixel.base],imageData.data[currPixel.base+1],imageData.data[currPixel.base+2],imageData.data[currPixel.base+3]]);

				//context.fillRect(coords.x, coords.y, 1, 1);
				
				up = getPixel({x:currPixel.x, y:currPixel.y-1}) * 4;
				down = getPixel({x:currPixel.x, y:currPixel.y+1}) * 4;
				//if above is also target color and above flag not set, push above to queue
				if(currPixel.y - 1 > 0  && imageData.data[up] == tarCL[0] && imageData.data[up+1] == tarCL[1] && imageData.data[up+2] == tarCL[2])// && imageData.data[up+3] == tarCL[3])
						//getColor2(imageData.data[up], imageData.data[up + 1], imageData.data[up + 2]) == targetCl)
				{
					if(upper === false) Q.push({x:currPixel.x, y:currPixel.y-1});
					upper = true
				}
				//else unset above flag
				else upper = false;
				
				//if below is also target color and below flag not set, push below to queue
				if(currPixel.y + 1 < context.canvas.height && imageData.data[down] == tarCL[0] && imageData.data[down+1] == tarCL[1] && imageData.data[down+2] == tarCL[2])// && imageData.data[down+3] == tarCL[3])
						//getColor2(imageData.data[down], imageData.data[down + 1], imageData.data[down + 2]) == targetCl)
				{
					if(lower === false) Q.push({x:currPixel.x, y:currPixel.y+1});
					lower = true
				}
				//else unset below flag
				else lower = false
				//move to the right
				currPixel.x++;
				currPixel.base = getPixel(currPixel)*4;
				
				//console.log("Next pixel");
				//console.log(currPixel);
				//console.log([imageData.data[currPixel.base],imageData.data[currPixel.base+1],imageData.data[currPixel.base+2],imageData.data[currPixel.base+3]]);

				//console.log("Up");
				//console.log([imageData.data[up],imageData.data[up+1],imageData.data[up+2],imageData.data[up+3]]);

				//console.log("Down");
				//console.log([imageData.data[down],imageData.data[down+1],imageData.data[down+2],imageData.data[down+3]]);

			}//end while
		}//end while
		context.putImageData(imageData, 0, 0);
	}
}


/*
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
			pixel = getPixel(currPixel) * 4;
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
*/

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
	//console.log(context.getImageData(0, 0, context.canvas.width, context.canvas.height).data[0]);
	//console.log(context.getImageData(0, 0, 1, 1).data[0]);
	context.fillStyle = "#FFFFFF";
	context.fillRect(0,0,context.canvas.width,context.canvas.height);
	currColor = "#000000"
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

$(".tools span").on('click', function(e){
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
		else if(steps[numsteps-1].tool !== bucket)
			//everything else has an array of points.
			steps[numsteps-1].addPoint(mouse);
		redraw();
	}
});

$('#paintML5').on('mousedown touchstart', function(e){
	e.preventDefault();
	var mouse = getMousePos(e, this);
	//console.log(mouse);
	//clean up steps if this step is after a series of undos
	while(steps.length > numsteps) steps.pop();
	//increase number of steps by 1
	numsteps++;
	//add this step to the array
	steps.push(new Tool(currSize, currColor, currTool, mouse));
	//console.log(steps);
	//console.log(currTool);
	mouseisdown = true;
	
	redraw();
	
	if(steps[numsteps-1].tool == bucket)
	{
		//context.fillStyle = currColor;
		//console.log(getColor(mouse));
		//console.log(mouse);
		pbucket(steps[numsteps-1]);
	}
});

$('#paintML5').on('mouseup mouseleave touchend', function(e){
	mouseisdown = false;
});

////////////////////////////////////////////////////////////////////////////////////////////


function redraw(){
	//console.log(steps);
	//console.log(steps.length);
	//console.log(numsteps);
	context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
	context.fillStyle = "#FFFFFF";
	context.fillRect(0,0,context.canvas.width,context.canvas.height);
	
	context.lineJoin = "round";
	//start and end coordinates
	var coordStart;
	var coordEnd;

	//draw every step except undone steps
	for(var i=0; i < numsteps; i++){
		//set the color and width of this path
		context.strokeStyle = steps[i].color;
		//context.fillStyle = steps[i].color;
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
			//var newCL = getCL(steps[i].color);
			pbucket(steps[i]);
			/*
			var imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
			//context.fillStyle = steps[i].color;
			for(var j=0; j<steps[i].points.length; j++)
			{
				console.log(steps[i].points[j].base);
				console.log(imageData.data[steps[i].points[j].base]);
				console.log(imageData.data[steps[i].points[j].base+1]);
				console.log(imageData.data[steps[i].points[j].base+2]);
				console.log(imageData.data[steps[i].points[j].base+3]);

				imageData.data[steps[i].points[j].base] = newCL[0];
				imageData.data[steps[i].points[j].base+1] = newCL[1];
				imageData.data[steps[i].points[j].base+2] = newCL[2];
				imageData.data[steps[i].points[j].base+3] = newCL[3];

				console.log(imageData.data[steps[i].points[j].base]);
				console.log(imageData.data[steps[i].points[j].base+1]);
				console.log(imageData.data[steps[i].points[j].base+2]);
				console.log(imageData.data[steps[i].points[j].base+3]);
				
				//context.beginPath();
				//context.fillRect(steps[i].points[j].x, steps[i].points[j].y, 1, 1);
				//context.closePath();
				//context.stroke();
			}
			//console.log(imageData);
			//console.log(steps[i]);
			//console.log(newCL);

			context.putImageData(imageData, 0, 0);
			//return;
			*/
		}
		else
		{
		//otherwise, draw all of the \delta lines
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
