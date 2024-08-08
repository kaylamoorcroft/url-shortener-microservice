require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");

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

// URL shortener microservice
app.route('/api/shorturl')
  .post((req, res) => {
    console.log(req.body);
    res.json({ original_url: req.body.url });})
  .get((req, res) => res.json({ original_url: req.query.original_url }));

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
