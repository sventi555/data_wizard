// const celebrate = require('celebrate');
const pg = require('./pg');
const parser = require('./parse');

async function isValidRestUrl(parsedUrl) {
	for (let i = 0; i < parsedUrl.length; i++) {
		if (i % 2 === 0) {
			const table = await pg.getTable(parsedUrl[i]);
			if (table.rows.length === 0) {
				return false;
			}
		} else if (!/:\d+/.test(parsedUrl[i])) {
			return false;
		}
	}

	return true;
}

function genericRoutes(app) {
	app.get('/api/v1/*',
		async (req, res) => {
			const url = req.path;
			const parsedUrl = parser(url);

			const validUrl = await isValidRestUrl(parsedUrl);
			if (!validUrl) {
				res.status(400).send('invalid REST url\n');
				return;
			}
			res.send('done\n');


		});

	// app.post('/api/v1/*',
	// 	(req, res, next) => {

	// 	});

	// app.put('/api/v1/*',
	// 	(req, res, next) => {

	// 	});

	// app.delete('/api/v1/*',
	// 	(req, res, next) => {

	// 	});
}

module.exports = genericRoutes;