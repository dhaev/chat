const path = require('path');
const http = require('http');
const axios = require('axios');
const hbs = require('hbs');
const dotenv = require('dotenv');
const socketio = require('socket.io');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const connectToDB = require("./config/mongodb");
const { ServerSession } = require('mongodb');
const cookieParser = require('cookie-parser');
const passportSocketIo = require('passport.socketio');
var crypto = require('crypto');

require("./config/googlePassport")(passport);
require("./config/localPassport")(passport);


const app = express();
//create an http server for the app 
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname,'public')));

hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
    return ( new mongoose.Types.ObjectId(arg1).toString() ===  new mongoose.Types.ObjectId(arg2).toString()) ? options.fn(this) : options.inverse(this);
});

hbs.registerPartials(__dirname + '/public');
hbs.registerHelper('json', function(context) {
  return btoa(JSON.stringify(context));
});

hbs.registerHelper('concat', function(arg1, arg2) {
  return arg1 + arg2.toString();
});
// view engine setup
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'hbs');

//connect to databas db
connectToDB()

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DB_STRING }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // Equals 1 day (1 day * 24 hr/1 day * 60 min/1 hr * 60 sec/1 min * 1000 ms / 1 sec)
  }
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // or the specific origin you want to give access to
  // res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/chat', require('./routes/dashboard'));


function onAuthorizeSuccess(data, accept){
  // console.log('successful connection to socket.io');
  
  // The accept-callback still allows us to decide whether to
  // accept the connection or not.
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept){
  if(error)
    throw new Error(message);
  console.log('failed connection to socket.io:', message);

  // We use this callback to log all of our failed connections.
  accept(null, false);
}



io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key: 'connect.sid',
  secret: 'keyboard cat',
  store: MongoStore.create({ mongoUrl: process.env.DB_STRING }),
  success: onAuthorizeSuccess,
  fail: onAuthorizeFail
}));


const roomMap = new Map();
io.on('connection', socket => {
     const  senderId = socket.request.user.id//.toString();
    // Handle 'join' event
    socket.on('join', (roomName) => {

      if(roomName){
      
    socket.join(roomName);
    // console.log('User joined:'+ roomName);
}
    });
 
  // console.log('User connected:', socket.request.user);
  // console.log(userId );

  socket.on("chatMessage", ( roomName, msg) => {
    // console.log('User received message:'+msg +" from" + roomName);

    io.to(roomName).emit("message", roomName, msg, senderId);
    // console.log('User sent message:'+msg +" to" + roomName);

  });

  socket.on("deleteMessage", ( roomName, msg) => {
    // console.log('User received deleted message:'+msg +" from" + roomName);
    io.to(roomName).emit("deletemessage", roomName, msg);
    // console.log('User sent deleted message:'+msg +" to" + roomName);
  });
});


const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`server running on port ${PORT}`));
