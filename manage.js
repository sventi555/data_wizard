const pg = require('./pg');
const {celebrate, Joi} = require('celebrate');

function formatCreateQuery(tableName, fields) {
	let queryString = `CREATE TABLE ${tableName} (`;

	fields.forEach((field, index) => {
		if (index !== 0) {
			queryString += ', ';
		}
		queryString += `${field.fieldName}`;
		queryString += ` ${field.type}`;
	});
	queryString += ')';

	return queryString;
}

exports.manageTables = function(app) {
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
				tableName: Joi.string().min(1).required(),
				fields: Joi.array().items(Joi.object().keys({
					fieldName: Joi.string().min(1).required(),
					type: Joi.string().required()
				})).min(1).max(20).required()
			})
		}),
		pg.typeValidator(),
		async (req, res) => {
			try {
				const queryString = formatCreateQuery(req.body.tableName, req.body.fields);

				await pg.query(queryString);
				const result = await pg.getTable(req.body.tableName);
				res.send(result.rows);
			} catch (err) {
				if (err.code === '42P07') {
					res.status(409).send();
				} else {
					res.status(500).send();
				}
			}
		});

	app.put('/api/manage/v1/tables',
		celebrate({
			body: Joi.object().keys({
				tableName: Joi.string().min(1).required(),
				fields: Joi.array().items(Joi.object().keys({
					fieldName: Joi.string().min(1).required(),
					type: Joi.string().required()
				})).min(1).max(20).required()
			})
		}),
		pg.typeValidator(),
		async (req, res) => {
			const table = await pg.getTable(req.body.tableName);
			if (table.rows.length > 0) {
				await pg.query(`DROP TABLE ${req.body.tableName}`);
			}
			const queryString = formatCreateQuery(req.body.tableName, req.body.fields);

			await pg.query(queryString);
			const result = await pg.getTable(req.body.tableName);
			res.send(result.rows);
		});

	app.delete('/api/manage/v1/tables',
		celebrate({
			body: Joi.object().keys({
				tableName: Joi.string().required()
			})
		}),
		async (req, res) => {
			const table = await pg.getTable(req.body.tableName);
			if (table.rows.length > 0) {
				await pg.query(`DROP TABLE ${req.body.tableName}`);
			}
			res.status(204).send();
		});
};