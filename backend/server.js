const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy
const session = require('express-session')
const MongoStore = require('connect-mongo')(session);

const User = require('./models').User;
const Doc = require('./models').Doc;

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

app.use(bodyParser.json());

app.use(session({
    secret: 'keyboard cat',
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));

/* PASSPORT SETUP */
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.use(passport.initialize());
app.use(passport.session());


app.post('/register', (req, res) => {
  const newUser = new User({
    username: req.body.username,
    password: req.body.password
  });

  newUser.save((err, result) => {
    if(err) {
      res.json({ success: false, error: err });
    } else {
      res.json({ success: true })
    }
  });
});

app.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ success: true, user: req.user });
})

app.post('/newDoc', (req, res) => {
  const newDoc = new Doc({
    name: req.body.name,
    owner: req.user._id
  });

  newDoc.save((err, result) => {
    if (err) {
      res.json({ success: false, error: err });
    } else {
      res.json({ success: true, doc: result });
    }
  });
});

app.get('/getmydocs', (req, res) => {
  Doc.find({ owner: req.user._id }, (err, result) => {
    if (err) {
      res.json({ success: false, error: err });
    } else {
      res.json({ success: true, docs: result });
    }
  });
});

app.get('/getDoc/:docid', (req, res) => {
  Doc.findById(req.params.docid, (err, result) => {
    if (err) {
      res.json({ success: false, error: err });
    } else {
      res.json({ success: true, doc: result });
    }
  });
});

app.post('/updateDoc/:docid', (req, res) => {
  Doc.update({ _id: req.params.docid }, { $set: { content: req.body.content }}, (err, result) => {
    if (err) {
      res.json({ success: false, error: err });
    } else {
      res.json({ success: true, result: result });
    }
  });
});

// app.get('/testUser', (req, res) => {
//   res.json({ user: req.user });
// })

app.listen(3000, function () {
  console.log('Backend server for Electron App running on port 3000!')
});
