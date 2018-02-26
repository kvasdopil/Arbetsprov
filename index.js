const express = require('express');
const app = express();

app.get('/', function (req, res) {
  res.redirect(301, '/index.html');
});

app.use(express.static(__dirname + '/static'));

app.listen(3000, function () {
  console.log('App listening on port 3000!');
});
