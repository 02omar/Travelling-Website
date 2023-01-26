var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const sessions = require('express-session');
var logger = require('morgan');
const dotenv = require("dotenv"); 
const { nextTick } = require('process');
const e = require('express');
var mongoClient = require('mongodb').MongoClient

const Destlist = ['bali', 'annapurna', 'paris', 'rome', 'santorini','inca Trail to Machu Picchu'];
mongoClient.connect("mongodb://127.0.0.1:27017", (err, client) => {
  if(err) throw err
  const db = client.db("myDB")
})
var app = express();

// view engine setup
dotenv.config({path: './config.env'});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

// Registration and Login
app.get('/registration',(req,res) => res.render('registration.ejs'))
app.post('/register', (req,res) => {
      const {username, password} = req.body;
      // console.log(req.body)
      mongoClient.connect("mongodb://127.0.0.1:27017", async(err, client) => {
        if(err) throw err
        
        const db = client.db("myDB")
        const alreadyExists = await db.collection("myCollection").findOne({username: username})
        // console.log(alreadyExists)
        if(alreadyExists)
          return res.status(400).render('registration.ejs', {error : "username already exists"});
        if(!username || !password)
          return res.status(400).render('registration.ejs', {error : "Please fill the missing fields"});
        db.collection("myCollection").insertOne({username, password, list:[]});

        
        res.status(201).redirect('/login?msg=success')
        
      })

    })
app.route('/login')
    .get((req,res) => {
    
      if(req.query && req.query.msg === 'success')
      res.render('login.ejs', {msg: "Account Created Successfully"})
      else
      res.render('login.ejs')
    })
    .post((req,res) => {
      try{
      const {username, password} = req.body;
      if(username == 'admin' && password == 'admin') {
          req.session.userid=req.body.username;
          return res.redirect('/home');
        }
      // console.log(req.body)
      mongoClient.connect("mongodb://127.0.0.1:27017", async(err, client) => {
        if(err) throw err

        
        
        const db = client.db("myDB")
        const user = await db.collection("myCollection").findOne({username: username})



        if(!user) return res.render('login.ejs', {error: "user does not exist"});
        // console.log(user.password)
        // console.log(password)
        if(! (user.password === password)) return res.render('login.ejs', {error: "Incorrect Password"});
        req.session.userid=req.body.username;
        // console.log(req.session)
        res.redirect('/home');

      
      });
    }
    catch(err) {
           res.render('login.ejs', {error: "Server Error"});  
    }
    })
app.get('/',(req,res) => {
  res.redirect('/login')
})

app.use((req,res,next) => {
  // console.log(req.session)
  if(req.session.userid)
    next();
  else
     res.redirect('/login');
})
app.get('/home', (req,res) => {
  // console.log();
  res.render('home.ejs')}
  );

app.post('/search', (req,res) => {
  const value = req.body.Search;
  const results = Destlist.filter(item => item.includes(value));
  // console.log(value)
  if(results.length > 0)
  res.render('searchresults.ejs', {results})
  else 
  res.render('searchresults.ejs', {err: "Destination not Found"})
})
app.get('/wanttogo', (req,res) => {
  let list = [];
   mongoClient.connect("mongodb://127.0.0.1:27017", async(err, client) => {
        if(err) throw err
        const db = client.db("myDB")
        // console.log(req.session)
        const user = await db.collection("myCollection").findOne({username: req.session.userid});
        // console.log(user)
        if(user && user.list != null)
        list = user.list
        // console.log(list)
         res.render('wanttogo.ejs', {list})  
      });
      
})

app.get('/hiking', (req,res) => {
  res.render('hiking.ejs')
})

app.get('/cities', (req,res) => {
  res.render('cities.ejs')
})

app.get('/islands', (req,res) => {
  res.render('islands.ejs')
})

const helperAddTo = (req,res, newValue) => {
  // console.log(req)
  mongoClient.connect("mongodb://127.0.0.1:27017", async(err, client) => {
        if(err) throw err
        const db = client.db("myDB")
        // console.log(req.session)
        const user = await db.collection("myCollection").findOne({username: req.session.userid});
        
          if(user.list.includes(newValue)) {
            return res.render(newValue.split(' ')[0],{ message: "Already Exists in the want to Go List"})
          }
          await db.collection("myCollection").updateOne({username: user.username}, { $push : {list: newValue}});
        
        return res.render(newValue.split(' ')[0],{ message: "Added Successfully"})

      });
      
}

app.route('/inca')
  .get((req,res) => {
  res.render('inca.ejs')})
  .post((req,res) => {
    helperAddTo(req,res, 'Inca Trail to Machu Picchu');
  });

app.route('/annapurna').get((req,res) => {
  res.render('annapurna.ejs')
}).post((req,res) => {
    helperAddTo(req,res, 'annapurna');    
  });

app.route('/paris').get((req,res) => {
  res.render('paris.ejs')
}).post((req,res) => {
    helperAddTo(req,res, 'paris');
  });

app.route('/rome').get((req,res) => {
  res.render('rome.ejs')
}).post((req,res) => {
    helperAddTo(req,res, 'rome');
  });

app.route('/bali').get((req,res) => {
  res.render('bali.ejs')
}).post((req,res) => {
    helperAddTo(req,res, 'bali');
  });

app.route('/santorini').get((req,res) => {
  res.render('santorini.ejs')
}).post((req,res) => {
    helperAddTo(req,res, 'santorini');
  });

const port = process.env.PORT || 3000; 
app.listen(port, ()=> {
    console.log(`Running on port ${port}`);
});



module.exports = app;
