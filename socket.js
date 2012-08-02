var express = require('express');
var app = module.exports = express.createServer();

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

var io = require('socket.io').listen(app);

var usernames = {};

io.sockets.on('connection', function (socket) {

   var counter=0;

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		counter++;
		// we tell the client to execute 'updatechat' with 2 parameters
		var timestamp = new Date();
		timestamp = MakeTimestamp(timestamp);
		
		var altcolor = '';
		if(counter%2){
			altcolor = 'red';
		}

		io.sockets.emit('updatechat', timestamp, socket.username, data, altcolor);
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		// echo to client they've connected
		
		socket.emit('updatechat', '', '', 'You are now connected');
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('updatechat', '', '', 'New user connected: ' + username);
		// update the list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', '', '', socket.username + ' has disconnected');
	});
});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});


function Date_toYMD(d) {
    var year, month, day;
    year = d.getFullYear();
    month = d.getMonth() + 1;
    if (month.length == 1) {
        month = "0" + month;
    }
    day = String(d.getDate());
    if (day.length == 1) {
        day = "0" + day;
    }
    return year + "-" + month + "-" + day;
}

function MakeTimestamp(d) {
    
    var year, month, day, hr, mm, ampm;
    
    year = String(d.getFullYear());
    month = String(d.getMonth() + 1);
    if (month.length == 1) {
        month = "0" + month;
    }
    day = String(d.getDate());
    if (day.length == 1) {
        day = "0" + day;
    }
    hr = String(d.getHours());
    var hh = hr;
    ampm = "am"
    if (hr >= 12) {
        hr = hh-12;
        ampm = "pm";
    }
    
    
    mm = String(d.getMinutes());
    if (mm.length == 1) {
        mm = "0" + mm;
    }
    
    //return month + "/" + day + "/" + year + ", " + hr + ":" + mm;
    return hr + ":" + mm + ampm;
}
