 
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
// instance of bullet
var Bullet = function(parent,angle){
	 
	  var self = Entity();
	  self.id = Math.random();
	  self.speedX = Math.cos(angle/180*Math.PI) * 10;
	  self.speedY = Math.sin(angle/180*Math.PI) * 10;
	  self.parent = parent;
	  self.timer = 0;
	  self.toRemove = false;
	  var super_update = self.update;
	  self.update = function(){
		  if(self.timer++ > 100)
			  self.toRemove = true;
		      super_update();
			     for(var i in Player.list){
					  var player = Player.list[i];
					  if(self.getDistance(player) < 30 && self.parent != player.id)
						  self.toRemove = true;
				  }		 
	  }
	     self.getDistance = function(player){
			 return Math.sqrt(Math.pow(self.x-player.x,2)+Math.pow(self.y-player.y,2));
		 };
               
	   Bullet.list[self.id] = self;
	  return self;
}

Bullet.list = {};
Bullet.update = function(){
	
 var pack_age = [];
 for(var i in Bullet.list){
 var bullet = Bullet.list[i]; 
      bullet.update();
	   if(bullet.toRemove)
         delete Bullet.list[i];
else{
      pack_age.push({

          x:bullet.x,
          y:bullet.y         
     });

   }
 }
 return pack_age;
}

var Player = function(id){	
var self = Entity();                    
         self.id = id; 
         self.number =    Math.floor(10 * Math.random());
         self.right = false;
         self.left =  false;
         self.up =   false;
         self.down = false;
		 self.pressAttack = false;
		 self.mouseAngle = 0;
         self.Maxspeed = 10;		  
    
               var super_update = self.update;
               self.update = function(){
                             self.updateSpeed();
                             super_update();
							 if(self.pressAttack){
								 for(var i=-3; i<3; i++){
	                             self.shootBullet(self.mouseAngle + i  * 10);
								 }
							}                            
					self.shootBullet = function(angle){
						 var b = Bullet(self.id,angle);
	                             b.x = self.x;
								 b.y = self.y;
					}
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

// player connect 
Player.onConnect = function(socket){

	  var player = Player(socket.id);
	  socket.on('keydown',function(data){
		  
		  switch(data.direction){
			  case 'left': player.left = data.state;  break; 
			  case 'up': player.up = data.state; break;
			  case 'down': player.down = data.state; break;
			  case 'right': player.right = data.state; break;
			  case 'mouseAngle': player.mouseAngle = data.state; break;
			  case 'space': player.pressAttack = data.state; break;
		  }
	  });
}

// user diconnect 
Player.onDisconnect = function(socket){
     delete Player.list[socket.id];
}

// update user and send packget
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

// socket rquire
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
	  
	  socket.on('sendMsgToServer', function(data){
	var playerName = ("" + socket.id).slice(2,7);
	for(var i in LIST_SOCKET){
		LIST_SOCKET[i].emit("addToChat", playerName + ": " + data);
    }
	  
	  });
     socket.on('evalServer', function(data){		 
	  var res = eval(data);
	  socket.emit("evalAnswer", res);
	  });
	  
	
	// disconect user die socket
socket.on('disconnect', function(){
     delete LIST_SOCKET[socket.id];
     Player.onDisconnect(socket);
  
});

});

setInterval(function(){
            var pack_age =  {
				player:Player.update(),
				bullet: Bullet.update()
			}
	 for(var i in LIST_SOCKET){
		 var socket = LIST_SOCKET[i];
		 socket.emit('movement',pack_age);
	 }
	 
	
},1000/25);
