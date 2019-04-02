// const celebrate = require('celebrate');
const pg = require('./pg');
const parser = require('./parse');

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
		async (req, res) => {
			const url = req.path;
			const parsedUrl = parser(url);

			// is it a valid rest url?
			const validUrl = await isValidRestUrl(parsedUrl);
			if (!validUrl) {
				res.status(400).send('invalid REST url\n');
			}

			// does the specific document exist?
			const resource = await resourceExists(parsedUrl);
			if (!resource) {
				res.status(404).send('resource does not exist\n');
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