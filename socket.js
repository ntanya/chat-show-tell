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

	socket.on('sendchat', function (data) {

		io.sockets.emit('updatechat', socket.username, data);
	});

	socket.on('adduser', function(username){
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		socket.emit('updatechat', 'Server', 'You are now connected');

		socket.broadcast.emit('updatechat', 'Server', 'New user connected: ' + username);
		io.sockets.emit('updateusers', usernames);
	});

	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];

		io.sockets.emit('updateusers', usernames);

		socket.broadcast.emit('updatechat', 'Server', socket.username + ' has disconnected');
	});
});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});
