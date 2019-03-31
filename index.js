const express = require('express');
const BodyParser = require('body-parser');
const {manageTables} = require('./manage');

const app = express();
app.use(BodyParser.json());
manageTables(app);


app.listen(3000);