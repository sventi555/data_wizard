const {Pool} = require('pg');

const pool = new Pool({
	user: 'postgres',
	database: 'data_wizard',
	port: 5432
});

const validTypes = [
	/boolean/i, /bool/i,
	/char(\(\d+\))?/i, /varchar(\(\d+\))?/i, /text/i,
	/smallint/i, /int/i, /serial/i,
	/float(\(\d+\))?/i, /real/i, /float8/i, /numeric/i,
	/date/i, /time/i, /timestamp/i, /timestamptz/i, /interval/i,
	/json/i, /jsonb/i,
	/uuid/i,
	/box/i, /line/i, /point/i, /lseg/i, /polygon/i,
	/inet/i, /macaddr/i
];

async function query(text, params) {
	try {
		const result = await pool.query(text, params);
		return result;
	} catch (err) {
		const error = new Error();
		error.code = err.code;
		throw error;
	}
}

async function getTable(tableName) {
	const table = await pool.query(`SELECT column_name,data_type 
									FROM information_schema.columns 
									WHERE table_name = '${tableName}'`);
	return table;
}

async function getTables() {
	const tables = await pool.query(`SELECT * FROM pg_catalog.pg_tables 
									WHERE schemaname != 'pg_catalog' 
									AND schemaname != 'information_schema'`);
	return tables;
}

function typeValidator() {
	return (req, res, next) => {
		for (const field of req.body.fields) {
			let valid = false;
			for (const type of validTypes) {
				if (type.test(field.type)) {
					valid = true;
					break;
				}
			}
			if (!valid) {
				res.status(400).send(`${field.type} is not a valid type.`);
			}
		}
		next();
	};
}

module.exports = {
	query,
	getTable,
	getTables,
	typeValidator
};
