'use strict';

var express = require('express');
var multer = require('multer');
var sizeOf = require( 'image-size' );
var fs = require("fs");
var jsonfile = require("jsonfile");
var request = require('request');

// never show the key ;)
var config = require("./config.json");

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'static/uploads/')
  },
  filename: function (req, file, cb) {
    //cb(null, file.fieldname + '-' + Date.now())
    //cb(null, file.originalname);
    cb(null, "result.jpg");
  }
})

var upload = multer({ storage: storage })

// API endpoint and key
var apiHost = "https://vision.googleapis.com";
var apiPath = "/v1/images:annotate?key=" + config.apikey;
var fullAPIPath = apiHost + apiPath;


io.on('connection', function(socket){
  console.log('a user connected');
  io.emit("helloworld", {message:"hi!"});
});


// for static files
app.use(express.static('static'));

// server hardcoded HTML for connected clients
app.get('/', function(req, res){
  res.sendFile(__dirname + '/static/index.html');
});

app.get('/result', function(req, res){
  res.sendFile(__dirname + '/static/result.html');
});

/*
app.get('/example/b', function (req, res, next) {
  console.log('the response will be sent by the next function ...');
  next();
}, function (req, res) {
  res.send('Hello from B!');
});
*/


// upload
app.post( '/upload', upload.single( 'file' ), function( req, res, next ) {

  //console.log(req.file.mimetype);
  if ( !req.file.mimetype == 'image/' ) {
    return res.status( 422 ).json( {
      error : 'The uploaded file must be an image'
    } );
  }

  var dimensions = sizeOf( req.file.path );

  if ( ( dimensions.width < 640 ) || ( dimensions.height < 480 ) ) {
    return res.status( 422 ).json( {
      error : 'The image must be at least 640 x 480px'
    } );
  }

  //console.log(req.file.path);


  fs.readFile(req.file.path, function(err, original_data){
      var base64Image = new Buffer(original_data, 'binary').toString('base64');
      buildJSON(base64Image);
  });


  return res.status( 200 ).send( req.file );
});


// listen for connections on port 3000
http.listen(8080, function(){
  console.log('listening on *:8080');
});


// ####################################
// build and write a JSON file
// right now I'm storing the JSON in a public var for reuse, too
function buildJSON (img) {
  console.log("buildJSON");

  var outputFileName = "static/json/data.json";

  // just fill the base64 string in
  var jsonSketch = { 'requests':[
                      { 'image': { 'content':img },
                      'features':[{ 'type':"LABEL_DETECTION", 'maxResults':10},
                                  { 'type':"FACE_DETECTION", 'maxResults':10}]}]
                    };

  // save as file for testing with the curl request
  // result -> json-file works fine via curl
  jsonfile.writeFile(outputFileName, jsonSketch, function (err) {
      postToAPI();
  });
}

// ####################################
// Post all the stuff to API with http.request()

function postToAPI () {

  fs.createReadStream('static/json/data.json').pipe(request.post({url:fullAPIPath}, function(err,httpResponse,body){
    //console.log("body::: " + body);
    var jsonObject = JSON.parse(body);

    if (jsonObject.responses[0].labelAnnotations) {
      for (var i = 0; i < jsonObject.responses[0].labelAnnotations.length; i++) {
        console.log("LABEL:: " + jsonObject.responses[0].labelAnnotations[i].description + "  ////   with score " + jsonObject.responses[0].labelAnnotations[i].score);
      }
    }

    // save the result
    var resultFileName = "static/json/result.json";
    jsonfile.writeFile(resultFileName, jsonObject, function (err) {
        console.log("resultfile saved::: " + resultFileName);

        io.emit('api', { message: "image processed" });
    });

  }));

}
