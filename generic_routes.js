const {celebrate, Joi} = require('celebrate');
const pg = require('./pg');
const parser = require('./parse');
const {ClientError} = require('./error_middleware');

async function isValidRestUrl(parsedUrl) {
	for (let i = 0; i < parsedUrl.length; i++) {
		if (i % 2 === 1 && !/\d+/.test(parsedUrl[i])) {
			return false;
		}
	}

	return true;
}

async function resourceExists(parsedUrl) {
	let parentId = null;
	let parentTable = null;
	let index = 0;
	while (index < parsedUrl.length - 1) {
		const tableName = parsedUrl[index];
		const id = parsedUrl[index + 1];

		//check if table exists
		const table = await pg.getTable(tableName);
		if (table.rows.length === 0) return false;

		// check if specific document exists
		let queryString = `SELECT _id FROM ${tableName} WHERE ${tableName}._id = ${id}`;
		if (parentId) {
			queryString += ` AND ${tableName}.${parentTable}_id = ${parentId}`;
		}

		const documents = await pg.query(queryString);
		if (documents.rows.length === 0) return false;

		parentId = id;
		parentTable = tableName;
		index += 2;
	}

	if (index < parsedUrl.length) {
		const tableName = parsedUrl[index];

		// check if table exists
		const table = await pg.getTable(tableName);
		if (table.rows.length === 0) return false;
	}
	return true;
}

function genericRoutes(app) {
	app.get('/api/v1/*',
		async (req, res, next) => {
			const url = req.path;
			const parsedUrl = parser(url);

			try {
				// is it a valid rest url?
				const validUrl = await isValidRestUrl(parsedUrl);
				if (!validUrl) {
					throw new ClientError(400, 'invalid REST url');
				}
				// does the specific document exist?
				const exists = await resourceExists(parsedUrl);
				if (!exists) {
					throw new ClientError(404, 'resource does not exist');
				}

				let queryString;
				if (parsedUrl.length % 2 === 1) {
					const tableName = parsedUrl[parsedUrl.length - 1];
					queryString = `SELECT * FROM ${tableName}`;
				} else {
					const tableName = parsedUrl[parsedUrl.length - 2];
					const id = parsedUrl[parsedUrl.length - 1];
					queryString = `SELECT * FROM ${tableName} WHERE _id = ${id}`;
				}
				const documents = await pg.query(queryString);

				res.send(documents.rows);
			} catch(err) {
				next(err);
			}
		});

	app.post('/api/v1/*',
		celebrate({
			body: Joi.object()
		}),
		async (req, res, next) => {
			const url = req.path;
			const body = req.body;
			const parsedUrl = parser(url);

			try {
				const validUrl = await isValidRestUrl(parsedUrl);
				if (!validUrl) {
					throw new ClientError(400, 'invalid REST url');
				}

				if (parsedUrl.length % 2 === 0) {
					throw new ClientError(400, 'you cannot POST to an existing document');
				}
				const exists = await resourceExists(parsedUrl);
				if (!exists) {
					throw new ClientError(404, 'that collection does not exist');
				}
				const tableName = parsedUrl[parsedUrl.length - 1];

				await pg.query(`
					INSERT INTO ${tableName} (${Object.keys(body).toString()}) 
					VALUES (${Object.values(body).map((value, index) => `$${index + 1}`).toString()})
				`, Object.values(body));

				res.status(201).send(body);

			} catch(err) {
				next(err);
			}
		});

	// app.put('/api/v1/*',
	// 	(req, res, next) => {

	// 	});

	// app.delete('/api/v1/*',
	// 	(req, res, next) => {

	// 	});
}

module.exports = genericRoutes;