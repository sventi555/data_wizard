const express = require('express');
const BodyParser = require('body-parser');
const manageRoutes = require('./manage');
const genericRoutes = require('./generic_routes');
const {errorMiddleware} = require('./error_middleware');

const app = express();
app.use(BodyParser.json());

manageRoutes(app);
genericRoutes(app);
app.use(errorMiddleware);

app.listen(3000);