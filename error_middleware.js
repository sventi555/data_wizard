const {PgError} = require('./pg');

function errorMiddleware(error, req, res, next) {
	if (error) {
		console.error(error);
		if (error instanceof PgError) {
			if (error.code === '42P07') {
				res.status(409).send(error.message);
			} else {
				res.status(400).send(error.message);
			}

		} else {
			res.status(500).send('an internal server error occured');
		}
	} else {
		next();
	}
}

module.exports = errorMiddleware;