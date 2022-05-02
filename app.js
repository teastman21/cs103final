/*
  app.js -- This creates an Express webserver with login/register/logout authentication
*/

// *********************************************************** //
//  Loading packages to support the server
// *********************************************************** //
// First we load in all of the packages we need for the server...
const createError = require("http-errors"); // to handle the server errors
const express = require("express");
const path = require("path");  // to refer to local paths
const cookieParser = require("cookie-parser"); // to handle cookies
const session = require("express-session"); // to handle sessions using cookies
//const bodyParser = require("body-parser"); // to handle HTML form input
const debug = require("debug")("personalapp:server"); 
const layouts = require("express-ejs-layouts");
const axios = require("axios");


// *********************************************************** //
//  Loading models
// *********************************************************** //
const ToDoItem = require("./models/ToDoItem")
const Player = require('./models/Player')
const Team = require('./models/Team')


// *********************************************************** //
//  Loading JSON datasets
// *********************************************************** //
const players = require('./public/data/players.json')


// *********************************************************** //
//  Connecting to the database
// *********************************************************** //

const mongoose = require( 'mongoose' );
const mongodb_URI = 'mongodb+srv://cs_sj:BrandeisSpr22@cluster0.kgugl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
//const mongodb_URI = 'mongodb+srv://cs_sj:BrandeisSpr22@cluster0.kgugl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'

mongoose.connect( mongodb_URI, { useNewUrlParser: true } );
mongoose.set('useFindAndModify', false); 
mongoose.set('useCreateIndex', true);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {console.log("we are connected!!!")});





// *********************************************************** //
// Initializing the Express server 
// This code is run once when the app is started and it creates
// a server that respond to requests by sending responses
// *********************************************************** //
const app = express();

// Here we specify that we will be using EJS as our view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");



// this allows us to use page layout for the views 
// so we don't have to repeat the headers and footers on every page ...
// the layout is in views/layout.ejs
app.use(layouts);

// Here we process the requests so they are easy to handle
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(bodyParser.urlencoded({ extended: false }));

// Here we specify that static files will be in the public folder
app.use(express.static(path.join(__dirname, "public")));

// Here we enable session handling using cookies
app.use(
  session({
    secret: "zzbbyanana789sdfa8f9ds8f90ds87f8d9s789fds", // this ought to be hidden in process.env.SECRET
    resave: false,
    saveUninitialized: false
  })
);

// *********************************************************** //
//  Defining the routes the Express server will respond to
// *********************************************************** //


// here is the code which handles all /login /signin /logout routes
const auth = require('./routes/auth');
const { deflateSync } = require("zlib");
app.use(auth)

// middleware to test is the user is logged in, and if not, send them to the login page
const isLoggedIn = (req,res,next) => {
  if (res.locals.loggedIn) {
    next()
  }
  else res.redirect('/login')
}

// specify that the server should render the views/index.ejs page for the root path
// and the index.ejs code will be wrapped in the views/layouts.ejs code which provides
// the headers and footers for all webpages generated by this app
app.get("/", (req, res, next) => {
  res.render("index");
});

app.get("/about", (req, res, next) => {
  res.render("about");
});

/*
    ToDoList routes
*/
app.get('/todo',
  isLoggedIn,   // redirect to /login if user is not logged in
  async (req,res,next) => {
    try{
      let userId = res.locals.user._id;  // get the user's id
      let items = await ToDoItem.find({userId:userId}); // lookup the user's todo items
      res.locals.items = items;  //make the items available in the view
      res.render("toDo");  // render to the toDo page
    } catch (e){
      next(e);
    }
  }
  )

  app.post('/todo/add',
  isLoggedIn,
  async (req,res,next) => {
    try{
      const {title,description} = req.body; // get title and description from the body
      const userId = res.locals.user._id; // get the user's id
      const createdAt = new Date(); // get the current date/time
      let data = {title, description, userId, createdAt,} // create the data object
      let item = new ToDoItem(data) // create the database object (and test the types are correct)
      await item.save() // save the todo item in the database
      res.redirect('/todo')  // go back to the todo page
    } catch (e){
      next(e);
    }
  }
  )

  app.get("/todo/delete/:itemId",
    isLoggedIn,
    async (req,res,next) => {
      try{
        const itemId=req.params.itemId; // get the id of the item to delete
        await ToDoItem.deleteOne({_id:itemId}) // remove that item from the database
        res.redirect('/todo') // go back to the todo page
      } catch (e){
        next(e);
      }
    }
  )

  app.get("/todo/completed/:value/:itemId",
  isLoggedIn,
  async (req,res,next) => {
    try{
      const itemId=req.params.itemId; // get the id of the item to delete
      const completed = req.params.value=='true';
      await ToDoItem.findByIdAndUpdate(itemId,{completed}) // remove that item from the database
      res.redirect('/todo') // go back to the todo page
    } catch (e){
      next(e);
    }
  }
)

/* ************************
  Loading (or reloading) the data into a collection
   ************************ */
// this route loads in the courses into the Course collection
// or updates the courses if it is not a new collection

app.get('/upsertDB',
  async (req,res,next) => {
    //await Course.deleteMany({})
    for (player of players){
      const {firstName,lastName,playerId,jobId}=player;
      await Player.findOneAndUpdate({firstName,lastName,playerId,jobId},player,{upsert:true})
    }
    const out = await Player.find({}).count();
    res.send("data uploaded: "+out)
  }
)


app.post('/players/byName',
  // show list of players by first name
  async (req,res,next) => {
    const {firstName} = req.body;
    const players = await Player.find({firstName:firstName})
    
    res.locals.players = players
    //res.json(courses)
    res.render('playerlist')
  }
)



// here we catch 404 errors and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// this processes any errors generated by the previous routes
// notice that the function has four parameters which is how Express indicates it is an error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.use(isLoggedIn)

app.get('/addPlayer/:playerId',
  // add a player to the user's team
  async (req,res,next) => {
    try {
      const playerId = req.params.playerId
      const userId = res.locals.user._id
      // check to make sure it's not already loaded
      const lookup = await Team.find({playerId,userId})
      if (lookup.length==0){
        const schedule = new Team({playerId,userId})
        await schedule.save()
      }
      res.redirect('/team/show')
    } catch(e){
      next(e)
    }
  })

app.get('/team/show',
  // show the current user's team
  async (req,res,next) => {
    try{
      const userId = res.locals.user._id;
      const playerIDs = 
         (await Team.find({userId}))
                        .sort(x => x.teamId)
                        .map(x => x.playerId)
      res.locals.players = await Player.find({_id:{$in: playerIds}})
      res.render('team')
    } catch(e){
      next(e)
    }
  }
)

app.get('/team/remove/:playerId',
  // remove a player from the user's team
  async (req,res,next) => {
    try {
      await Team.remove(
                {userId:res.locals.user._id,
                 playerId:req.params.playerId})
      res.redirect('/team/show')

    } catch(e){
      next(e)
    }
  }
)
// *********************************************************** //
//  Starting up the server!
// *********************************************************** //
//Here we set the port to use between 1024 and 65535  (2^16-1)
const port = "5000";
app.set("port", port);

// and now we startup the server listening on that port
const http = require("http");
const server = http.createServer(app);

server.listen(port);

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

server.on("error", onError);

server.on("listening", onListening);

module.exports = app;
