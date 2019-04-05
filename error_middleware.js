const {PgError} = require('./pg');

class ClientError extends Error {
	constructor(code, message) {
		super(message);
		this.code = code;
	}
}

function errorMiddleware(error, req, res, next) {
	if (error) {
		if (error instanceof PgError) {
			if (error.code === '42P07') {
				res.status(409).json({
					code: error.code,
					message: error.message
				});
			} else {
				res.status(400).json({
					code: error.code,
					message: error.message
				});
			}

		} else if (error instanceof ClientError) {
			res.status(error.code).json({
				code: error.code,
				message: error.message
			});

		} else {
			res.status(500).json({
				code: 500,
				message: 'an internal server error has occurred'
			});
		}
	} else {
		next();
	}
}

module.exports = {
	ClientError,
	errorMiddleware
};