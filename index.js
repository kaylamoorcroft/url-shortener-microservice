require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);

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
const urlSchema = new Schema({ 
  original_url: String,
  short_url: Number 
});
const Url = mongoose.model("Url", urlSchema);

// create and save url entry in database
const createUrl = async function(url) {
  const new_url = new Url({ original_url: url });
  await new_url.save();
  return new_url;
};

// find url entry by short_url
const findUrlById = urlId => Url.findOne({ short_url: urlId}).then(existing_url => existing_url);

// find url entry by original_url
const findUrl = url => Url.findOne({original_url: url}).then(existing_url => existing_url);

// URL shortener microservice
app.route('/api/shorturl')
  .post((req, res) => {
    findUrl(req.body.url).then(existing_url => {
    console.log(existing_url);
    console.log("------");
    // if url exists, get id
    if (existing_url) {
      console.log("url exists");
      console.log("short_url: " + existing_url.short_url);
    }
    // otherwise, create new url and get id
    else {
      console.log("url doesn't exist");
      createUrl(req.body.url).then(new_url => {
        console.log(`new short_url for ${req.body.url}: ${new_url.short_url}`);
      });
    }
    res.json({ original_url: req.body.url });});
  });
    /*
  .get((req, res) => {
    const url = findUrl(req.query.original_url);
    console.log("url: \n" + url);
    res.json({ original_url: url.original_url});
  });*/

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
