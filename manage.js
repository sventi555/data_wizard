const pg = require('./pg');
const {celebrate, Joi} = require('celebrate');

function formatCreateQuery(tableName, fields) {
	let queryString = `CREATE TABLE ${tableName} (`;
	fields.unshift({fieldName: '_id', type: 'serial PRIMARY KEY'});
	fields.forEach((field, index) => {
		if (index !== 0) {
			queryString += ', ';
		}
		queryString += `${field.fieldName} ${field.type}`;
		if (field.constraint) {
			queryString += ` ${field.constraint}`;
		}
	});
	queryString += ')';

	return queryString;
}

function manageTables(app) {
	app.get('/api/manage/v1/tables',
		async (req, res) => {
			let result;
			if (req.query.tableName) {
				result = await pg.getTable(req.query.tableName);
			} else {
				result = await pg.getTables();
			}
			res.send(result.rows);
		});

	app.post('/api/manage/v1/tables',
		celebrate({
			body: Joi.object().keys({
				tableName: Joi.string().not('').required(),
				fields: Joi.array().items(Joi.object().keys({
					fieldName: Joi.string().not('').invalid('_id').required(),
					type: Joi.string().required(),
					constraint: Joi.string()
				})).required()
			})
		}),
		pg.typeValidator(),
		async (req, res, next) => {
			try {
				const queryString = formatCreateQuery(req.body.tableName, req.body.fields);

				await pg.query(queryString);
				const result = await pg.getTable(req.body.tableName);
				res.send(result.rows);
			} catch (err) {
				next(err);
			}
		});

	app.put('/api/manage/v1/tables',
		celebrate({
			body: Joi.object().keys({
				tableName: Joi.string().not('').required(),
				fields: Joi.array().items(Joi.object().keys({
					fieldName: Joi.string().not('').invalid('_id').required(),
					type: Joi.string().required(),
					constraint: Joi.string()
				})).required()
			})
		}),
		pg.typeValidator(),
		async (req, res, next) => {
			const table = await pg.getTable(req.body.tableName);
			try {
				if (table.rows.length > 0) {
					await pg.query(`DROP TABLE ${req.body.tableName}`);
				}
				const queryString = formatCreateQuery(req.body.tableName, req.body.fields);

				await pg.query(queryString);
				const result = await pg.getTable(req.body.tableName);
				res.send(result.rows);
			} catch(err) {
				next(err);
			}
		});

	app.delete('/api/manage/v1/tables',
		celebrate({
			body: Joi.object().keys({
				tableName: Joi.string().not('').required()
			})
		}),
		async (req, res, next) => {
			const table = await pg.getTable(req.body.tableName);
			try {
				if (table.rows.length > 0) {
					await pg.query(`DROP TABLE ${req.body.tableName}`);
				}
				res.status(204).send();
			} catch(err) {
				next(err);
			}
		});
}

module.exports = manageTables;