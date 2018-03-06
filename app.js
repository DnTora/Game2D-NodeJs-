 
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

var Entity = function(){
 var self = {             x: 200,
             y: 200,
             speedX: 0,
             speedY: 0,
             id: ""
}
  self.update = function (){
      self.updatePosition(); 
  }
  self.updatePosition = function(){
     self.x  += self.speedX;
     self.y  += self.speedY;
  }
  return self;
}
var Player = function(id){	
var self = Entity();                    
         self.id = id; 
         self.number =    Math.floor(10 * Math.random());
         self.right = false;
         self.left =  false;
         self.up =   false;
         self.down = false;
         self.Maxspeed = 10;		  
    
               var super_update = self.update;
               self.update = function(){
                             self.updateSpeed();
                             super_update();
                   }
              
             self.updateSpeed = function(){
              
                     if(self.right)
                           self.speedX = self.Maxspeed;
              else if(self.left)
                           self.speedX = -self.Maxspeed;
              else self.speedX = 0;

                     if(self.up)
                           self.speedY = -self.Maxspeed;
              else if(self.down)
                           self.speedY =  self.Maxspeed;
              else self.speedY = 0;


     }
            Player.list[id] = self;
	return self
}
Player.list = {};
Player.onConnect = function(socket){

	  var player = Player(socket.id);
	  socket.on('keydown',function(data){
		  
		  switch(data.direction){
			  case 'left': player.left = data.state;  break; 
			  case 'up': player.up = data.state; break;
			  case 'down': player.down = data.state; break;
			  case 'right': player.right = data.state; break;
		  }
	  });
}
Player.onDisconnect = function(socket){
     delete Player.list[socket.id];
}
Player.update = function(){
 var pack_age = [];
 for(var i in Player.list){
 var player = Player.list[i]; 
      player.update();
      pack_age.push({

          x:player.x,
          y:player.y,
          number: player.number
});

}
 return pack_age;

}
var io = require('socket.io')(server,{});
io.sockets.on('connection', function(socket){
	// check user connect
	socket.on('client', function(data){
		console.log(data.connect);
	});
	  // build user add him to list player and to socket
	  socket.id = Math.random();
	  LIST_SOCKET[socket.id] = socket;
 
      Player.onConnect(socket);
	  
	// disconect user die socket
socket.on('disconnect', function(){
     delete LIST_SOCKET[socket.id];
     Player.onDisconnect(socket);
  
});

});
setInterval(function(){
            var pack_age =  Player.update();
	
	 for(var i in LIST_SOCKET){
		 var socket = LIST_SOCKET[i];
		 socket.emit('movement',pack_age);
	 }
	 
	
},1000/25);
