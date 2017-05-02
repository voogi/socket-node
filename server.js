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
        },
        score : 0
    };

    // client.emit("welcome", client.id);

    io.emit("newplayer", clients);

    client.on("move", function(data){
        clients[client.id] = extend(true,clients[client.id],data);
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

    client.on("playerdead", function(data){

        console.log("KILLER", data.killer);

        clients[data.killer].score += 1;

        io.emit("otherplayerdead", {
            killer : data.killer,
            clientId : client.id,
            clients : clients
        });
    });

});


http.listen(3000, "0.0.0.0", function(){
    console.log("listening on *:3000");
});

let extend = function () {

    let extended = {};
    let deep = false;
    let i = 0;
    let length = arguments.length;

    // Check if a deep merge
    if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
        deep = arguments[0];
        i++;
    }

    // Merge the object into the extended object
    let merge = function (obj) {
        for ( let prop in obj ) {
            if ( Object.prototype.hasOwnProperty.call( obj, prop ) ) {
                // If deep merge and property is an object, merge properties
                if ( deep && Object.prototype.toString.call(obj[prop]) === '[object Object]' ) {
                    extended[prop] = extend( true, extended[prop], obj[prop] );
                } else {
                    extended[prop] = obj[prop];
                }
            }
        }
    };

    // Loop through each object and conduct a merge
    for ( ; i < length; i++ ) {
        let obj = arguments[i];
        merge(obj);
    }

    return extended;

};