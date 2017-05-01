let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);

//static folder (html/css/js)
app.use(express.static('static'));

app.get("/", function(req, res){
    res.sendFile(__dirname + "/index.html");
});

let clients = {};

io.on('connection', function( client ){

    console.log("---------------------user connected--"+client.id+"---------------------------------");

    clients[client.id] = {
        name : {
            str : client.handshake.query.name
        }
    };

    io.emit("newplayer", clients);

    client.on("move", function(data){
        clients[client.id] = data;
        client.broadcast.emit("moved", clients);
    });

    client.on('disconnect', function(){
        console.log("player disconnected");
        io.emit("leaveplayer", client.id);
        delete clients[client.id];
    });

    client.on("hit", function(data){
        console.log("HIT", data);
        io.emit("onhit", {
            clientId : data.clientId,
            weaponType : data.weaponType
        });
    });

    client.on("projectile", function(projectile){
        client.broadcast.emit("otherprojectile", projectile);
    });

});


http.listen(3000, "0.0.0.0", function(){
    console.log("listening on *:3000");
});