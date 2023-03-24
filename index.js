require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  }
});

const exerciseSchema = new mongoose.Schema({
  userid: String,
  username: String,
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: Date
})

const User = mongoose.model('User', userSchema);

const Exercise = mongoose.model('Exercise', exerciseSchema);

//User.remove({}).then((doc) => { console.log(doc);}).catch((err) => {console.log(err);});
//Exercise.remove({}).then((doc) => { console.log(doc);}).catch((err) => {console.log(err);});

app.post('/api/users', (req, res) => {
  const user = new User({
    username: req.body.username
  });
  user
    .save()
    .then((doc) => {
      res.json({
        _id: doc._id,
        username: doc.username
      });
    })
    .catch((err) => {
      res.json({ error: err.message } );
    });
});

app.get('/api/users', (req, res) => {
  User
    .find({})
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      res.json({ error: err.message } );
    })
});

app.post('/api/users/:_id/exercises', (req, res) => {
  User
    .findById(req.params._id)
    .then((doc) => {
      const exercise = new Exercise({
        userid: req.params._id,
        username: doc.username,
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date
          ? new Date(req.body.date)
          : new Date()
      });
      exercise
        .save()
        .then((doc) => {
          res.json({
            _id: doc.userid,
            username: doc.username,
            description: doc.description,
            duration: doc.duration,
            date: doc.date.toDateString()
          });
        })
        .catch((err) => {
          res.json({ error: err.message });
        })
    })
    .catch((err) => {
      res.json({ error: err.message });
    });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const limit = Number(req.query.limit) || 0;
  const from = req.query.from || new Date(0);
  const to = req.query.to || Date.now();
  User
    .findById(req.params._id)
    .then((doc) => {
      Exercise
        .find({
          userid: req.params._id,
          date: { 
            $gte: from, 
            $lte: to
          }
        })
        .select('-_id -userid -__v')
        .limit(limit)
        .then((doc) => {
          const userLog = doc.map((item) => {
            return {
              description: item.description,
              duration: item.duration,
              date: item.date.toDateString()
            };
          });
          res.json({
            _id: req.params._id,
            username: doc.username,
            count: userLog.length,
            log: userLog
          })
        })
        .catch((err) => {
          res.json({ error: err.message });
        });
    })
    .catch((err) => {
      res.json({ error: err.message });
    })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
