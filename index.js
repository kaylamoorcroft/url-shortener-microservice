require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// for parsing body of post requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// url schema and model
const Schema = mongoose.Schema;
const urlSchema = new Schema({ original_url: String });
const Url = mongoose.model("Url", urlSchema);

// create and save url entry in database
const createUrl = function(url, done) {
  const new_url = new Url({ original_url: url });
  new_url.save();
  return new_url;
};

// find url entry by id
const findUrlById = function(urlId, done) {
  Url.findById(urlId, (err, data) => {
    if (err) return console.error(err);
    done(null, data);
  });
};

// URL shortener microservice
app.route('/api/shorturl')
  .post((req, res) => {
    res.json({ original_url: req.body.url });})
  .get((req, res) => res.json({ original_url: req.query.original_url }));

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
