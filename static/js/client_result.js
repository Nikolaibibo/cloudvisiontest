var canvas;
var context;

var getDimensions = function (item) {
  var img = new Image();
  img.src = item.css('background-image').replace(/url\(|\)$|"/ig, '');
  //return img.width + ' ' + img.height;
  return {width: img.width, height: img.height};
};

function drawTypo (obj) {
  //console.log("drawTypo");
  var contentObject = obj;
  var bounding = contentObject.boundingPoly.vertices;

  context.font = "12px Arial";
  context.fillStyle = "yellow";
  context.fillText(checkMood(obj).stimmung, bounding[0].x, bounding[0].y-5);

}


// method to draw lines on the canvas
function drawPath (obj) {
  //console.log("drawPath:");

  var contentObject = obj;
  var bounding = contentObject.boundingPoly.vertices;
  var fdbounding = contentObject.fdBoundingPoly.vertices;

  // bounding box
  var path1 = new paper.Path();
  path1.strokeColor = 'yellow';
  // take the first point and use moveTo
  var start = new paper.Point(bounding[0].x, bounding[0].y);
  path1.moveTo(start);

  // walk through array starting with index 1
  for (var i = 1; i < bounding.length; i++) {
    //console.log("x: " + verticesArray[i].x + "    y: " + verticesArray[i].y);
    var tempPoint = new paper.Point(bounding[i].x, bounding[i].y);
    path1.lineTo(tempPoint);
  }

  // close the path by going to the first coordinates
  path1.lineTo(start);



  // fdbounding box
  var path2 = new paper.Path();
  path2.strokeColor = 'red';
  // take the first point and use moveTo
  var start2 = new paper.Point(fdbounding[0].x, fdbounding[0].y);
  path2.moveTo(start2);
  // walk through array starting with index 1
  for (var i = 1; i < fdbounding.length; i++) {
    //console.log("x: " + verticesArray[i].x + "    y: " + verticesArray[i].y);
    var tempPoint = new paper.Point(fdbounding[i].x, fdbounding[i].y);
    path2.lineTo(tempPoint);
  }
  path2.lineTo(start2);

  // draw with paper
  paper.view.draw();
}

function checkMood (obj) {

  var mood = "not identified";

  var joy = obj.joyLikelihood;
  var sorrow = obj.sorrowLikelihood;
  var anger = obj.angerLikelihood;
  var surprise = obj.surpriseLikelihood;

  var vertice = obj.boundingPoly.vertices[0];
  console.log("joy: " + joy + "     " + vertice.x);

  if (joy == "VERY_LIKELY"){
    mood = "Spass";
  }

  if (sorrow == "VERY_LIKELY"){
    mood = "Traurig";
  }

  if (anger == "VERY_LIKELY"){
    mood = "Ärgerlich";
  }

  if (surprise == "VERY_LIKELY"){
    mood = "Überrascht";
  }

  var returnObj = {
                    stimmung: mood,
                    xpos: vertice.x,
                    ypos: vertice.y
                  };

  return returnObj;
}


window.onload = function() {

  // set the canvas size to the background image size
  canvas = document.getElementById('myCanvas');
  canvas.width = getDimensions($('#myCanvas')).width;
  canvas.height = getDimensions($('#myCanvas')).height;

  // setup of paper object
  paper.setup(canvas);
  context = canvas.getContext("2d");
  // load json
  $.getJSON("json/result.json", function(json) {
    //console.log(json.responses[0].faceAnnotations[0].boundingPoly.vertices[0].x);
    for (var i = 0; i < json.responses[0].faceAnnotations.length; i++) {
      drawPath(json.responses[0].faceAnnotations[i]);
      //drawTypo(json.responses[0].faceAnnotations[i]);
    }

    for (var j = 0; j < json.responses[0].faceAnnotations.length; j++) {
      drawTypo(json.responses[0].faceAnnotations[j]);
    }
    //drawTypo(json.responses[0].faceAnnotations[0]);
    //drawTypo(json.responses[0].faceAnnotations[1]);

    // show the label results
    for (var i = 0; i < json.responses[0].labelAnnotations.length; i++) {
      var bestMatchString = json.responses[0].labelAnnotations[i].description + "  :::  "  + json.responses[0].labelAnnotations[i].score;

      context.font = "16px Arial";
      context.fillStyle = "red";
      context.fillText(bestMatchString, 20, (20*i + 30));
    }





  });
}
