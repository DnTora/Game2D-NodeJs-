
var express = require('express');
var app = express();
var server = require('http').Server(app);

app.get('/',function(req,res){
	res.sendFile(__dirname + "/client/index.html")
});

app.use('/client',express.static(__dirname + '/client'));
server.listen(4000);
console.log('connect server');

var LIST_SOCKET = {};
var LIST_PLAYER = {};
var Player = function(id){	
var self = { 
          x: 200,
		  y: 200,
		  id: id,
	      number:  + Math.floor(10 * Math.random()),
		  right:false,
          left: false,
          up:   false,
          down: false,
          speed: 10		  
	}  
	return self
}
var io = require('socket.io')(server,{});
io.sockets.on('connection', function(socket){
	// check user connect
	socket.on('client', function(data){
		console.log(data.connect);
	});
	  // build user add him to list player and to socket
	  socket.id = Math.random();
	  
	  var player = Player(socket.id)
	  socket.on('keydown',function(data){
		  
		  switch(data.direction){
			  case 'left': player.left = data.state; break;
			  case 'up': player.up = data.state; break;
			  case 'down': player.down = data.state; break;
			  case 'right': player.right = data.state; break;
		  }
	  });
	  
	  LIST_PLAYER[socket.id] = player;
	  LIST_SOCKET[socket.id] = socket;

	  
	// disconect user die socket
socket.on('disconnect', function(){
     delete LIST_PLAYER[socket.id];
	 delete LIST_SOCKET[socket.id];
});

});
setInterval(function(){
	var pack_age = [];
	
	 for(var i in LIST_PLAYER){		
	    var player = LIST_PLAYER[i];
		
		playerMovement(player);
            		
		 pack_age.push(player);
	 }
	 for(var i in LIST_SOCKET){
		 var socket = LIST_SOCKET[i];
		 socket.emit('movement',pack_age);
	 }
	 
	
},1000/30);
function playerMovement(player){
	
	if(player.right)
		player.x += player.speed;	        
	if(player.left)
		player.x -= player.speed;		
	if(player.down)
		player.y += player.speed;
	if(player.up)
		player.y -= player.speed;
	
	
}