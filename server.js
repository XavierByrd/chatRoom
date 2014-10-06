var mongo = require('mongodb').MongoClient,
	client = require('socket.io').listen(8080).sockets;

mongo.connect('mongodb://127.0.0.1/chat', function(err, db) {
	if(err) throw err;

	client.on('connection', function(socket){

		//database collection
		//your collection name
		var col = db.collection('messages');

		sendStatus = function(s) {
			socket.emit('status', s);
		};

		//Upon connection emit all messages with limit and send to socket
		col.find().limit(100).sort({_id: 1}).toArray(function(err, res){
			if(err) throw err;
			//emits to one user 
			socket.emit('output', res);
		});

		// Wait for input
		socket.on('input', function(data) {
			// Data is a passed in JSON object
			var name = data.name,
				message = data.message;
				//regular expresion to prevent dummy data
				whitespacePattern = new RegExp("^\s*$");

				if(whitespacePattern.test(name) || whitespacePattern.test(message)) {
					// Validation is done on the server side
					// this prevent invalid client data from
					// being sent to our poor server.
					sendStatus('Name and message is required.');
				} else {
					col.insert({name: name, message: message}, function() {
						// Emit latest message to ALL clients
						client.emit('output', [data]);

						sendStatus({
							message: "Message sent.",
							clear: true
						});
					});
				}
		});
	});
});