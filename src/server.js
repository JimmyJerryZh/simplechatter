var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = 3000;

var msgList = [];
var userList = [];

//https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid() {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < 5; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

//also from stachoverflow formatted time
var getDate = function() {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? '0' : '') + hour;

    var min = date.getMinutes();
    min = (min < 10 ? '0' : '') + min;

    return hour + ':' + min;
};

io.on('connection', function(socket) {
    socket.on('firstConnect', function(cookie) {
        console.log('cookie below');
        console.log(cookie);
        if (cookie != null && typeof cookie.name != 'undefined') {
            console.log('saw a cookie');
            console.log(userList);
            userList.push(cookie);
            socket.emit('getName', cookie);
            socket.emit('receiveMessageList', msgList);
            socket.name = cookie.name;
            console.log(userList);
            io.emit('receiveUser', userList);
        } else {
            var genName = makeid();
            userList.forEach(function(user) {
                if (user.name === genName) {
                    genName = makeid();
                }
            });
            var user = {
                name: genName,
                color: '#000000'
            };
            userList.push(user);
            socket.emit('getName', user);
            socket.emit('receiveMessageList', msgList);
            socket.name = user.name;
            io.emit('receiveUser', userList);
        }
    });

    // socket.on('reconnecting', function(user) {
    //     console.log('reconnecting.....');
    //     console.log('userList below');
    //     userList.push(user);
    //     socket.name = user.name;
    //     console.log(userList);
    //     socket.emit('receiveMessageList', msgList);
    //     io.emit('receiveUser', userList);
    // });

    socket.on('sentMessage', function(msg) {
        console.log(socket.name);
        msg.time = getDate();
        msgList.push(msg);
        io.emit('receiveMessage', msg);
    });

    socket.on('nameChange', function(name) {
        console.log('changing names');
        console.log('old user list');
        console.log(userList);
        var dontEmit = false;
        userList.forEach(function(user) {
            if (user.name === name.newName) {
                var err = {
                    type: 'err',
                    text: 'error name already taken',
                    time: getDate(),
                    user: 'Server',
                    currentuser: false,
                    color: '#DC143C'
                };
                dontEmit = true;
                socket.emit('receiveMessage', err);
                return;
            }
        });
        if (!dontEmit) {
            userList.forEach(function(user) {
                if (user.name === name.name) {
                    user.name = name.newName;
                }
            });
            socket.emit('getName', { name: name.newName, color: name.color });
            socket.name = name.newName;
            io.emit('receiveUser', userList);
        }
    });

    socket.on('colorChange', function(name) {
        console.log('changing colors');
        console.log('old user list');
        console.log(userList);
        userList.forEach(function(user) {
            if (user.name === name.name) {
                user.color = name.newColor;
            }
        });
        console.log('new userlist');
        console.log(userList);
        socket.emit('getName', { name: name.name, color: name.newColor });
        io.emit('receiveUser', userList);
    });

    //https://stackoverflow.com/questions/10024866/remove-object-from-array-using-javascript
    socket.on('disconnect', function(user) {
        console.log('old user list');
        console.log(userList);
        var filtered = userList.filter(function(el) {
            return el.name !== socket.name;
        });
        userList = filtered;
        console.log('new user list');
        console.log(filtered);
        var disc = {
            type: 'disconnect',
            text: socket.name + ' has disconnected!',
            time: getDate(),
            user: 'Server',
            currentuser: false,
            color: '#DC143C'
        };
        socket.broadcast.emit('receiveMessage', disc);
        io.emit('receiveUser', filtered);
    });
});

http.listen(port, function() {
    console.log('listening on: ' + port);
});
