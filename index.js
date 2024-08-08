require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);
const dns = require('dns'); 
const { doesNotMatch } = require('assert');

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

// find next short_url id
const findNextId = async () => {
  const query = Url.find({}).sort({"short_url" : -1}).limit(1).exec();
  const entries = await query;
  // if no urls in database, return 1
  if (!entries.length) return 1;
  // otherwise, return next num
  const nextId = entries[0].short_url + 1;
  return nextId;
};

// create and save url entry in database
const createUrl = async function(url) {
  const urlId = await findNextId();
  console.log("new id is: " + urlId);
  const newUrl = new Url({ original_url: url, short_url: urlId });
  await newUrl.save();
  return newUrl;
};

// find original_url from short_url
const findUrlById = urlId => Url.findOne({ short_url: urlId}).then(existing_url => existing_url.original_url);

// find url entry by original_url
const findUrl = url => Url.findOne({original_url: url}).then(existing_url => existing_url);

// get host name from full url
const getHostName = url => {
  // replace https:// and ignore any params after ?
  let hostname = url.replace("https://","").split("?",1)[0];
  // remove / at end if there is one
  if (hostname.substr(-1) === "/") { hostname = hostname.substr(0, hostname.length-1); }
  return hostname;
};

// URL shortener microservice
app.post('/api/shorturl', (req, res) => {
  console.log("request url: " + req.body.url);
  const hostname = getHostName(req.body.url);
  // check if valid url 
  dns.lookup(hostname, (err, address, family) => {
    if (err) {
      // resturn special json response
      res.json({ error: 'invalid url' });
      console.log(`"${hostname}" is invalid hostname`);
    }
    else {
      // check if url exists
      findUrl(req.body.url).then(existing_url => {
        console.log(existing_url);
        console.log("------");
        // if url exists, get id
        if (existing_url) {
          const { original_url: url, short_url: id } = existing_url;
          console.log("url exists:");
          console.log("short_url: " + id);
          // send json object
          res.json({ original_url: url, short_url: id});
        }
        // otherwise create new url and get id
        else {
          console.log("url doesn't exist");
          createUrl(req.body.url).then(({ original_url: url, short_url: id }) => {
            console.log(`new short_url for ${url}: ${id}`);
            // send json object
            res.json({ original_url: url, short_url: id });
          });
        }
      });
    }
  });
});
// redirect to original url from short url
app.get('/api/shorturl/:id', (req, res) => {
  console.log("short url requested: " + req.params.id);
  findUrlById(req.params.id).then(original_url => { 
    console.log("original_url: " + original_url)
    res.redirect(original_url);
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
