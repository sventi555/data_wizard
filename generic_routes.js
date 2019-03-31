const celebrate = require('celebrate');

function genericRoutes(app) {
	app.get('/api/v1/*',
		(req, res, next) => {

		});

	app.post('/api/v1/*',
		(req, res, next) => {

		});

	app.put('/api/v1/*',
		(req, res, next) => {

		});

	app.delete('/api/v1/*',
		(req, res, next) => {

		})
}

module.exports = genericRoutes;