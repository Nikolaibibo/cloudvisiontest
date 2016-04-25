var socket = io();

socket.on('api', function(msg) {
    console.log('api:: ' + msg.message);
    window.location = "/result";
});

socket.on('helloworld', function(msg) {
    console.log('helloworld:: ' + msg.message);
});


$(document).ready(function(){
  console.log("doc ready");
});
