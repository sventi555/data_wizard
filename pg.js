const {Pool} = require('pg');

const pool = new Pool({
	user: 'postgres',
	database: 'data_wizard',
	port: 5432
});

const VALID_TYPES = [
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

const VALID_CONSTRAINTS = [
	/primary key/i, /unique/i,
	/foreign key/i, /references \w+/i,
	/not null/i,
	/check .*/i
];

class PgError extends Error {
	constructor(code, message) {
		super(message);
		this.code = code;
	}
}

async function query(text, params) {
	try {
		const result = await pool.query(text, params);
		return result;
	} catch (err) {
		throw new PgError(err.code, err.message);
	}
}

async function getTable(tableName) {
	try {
		const table = await pool.query(`SELECT column_name,data_type 
										FROM information_schema.columns 
										WHERE table_name = '${tableName}'`);
		return table;
	} catch (err) {
		throw new PgError(err.code, err.message);
	}
}

async function getTables() {
	try {
		const tables = await pool.query(`SELECT * FROM pg_catalog.pg_tables 
										WHERE schemaname != 'pg_catalog' 
										AND schemaname != 'information_schema'`);
		return tables;
	} catch (err) {
		throw new PgError(err.code, err.message);
	}
}

function typeValidator() {
	return (req, res, next) => {
		for (const field of req.body.fields) {
			let validType = false;
			let validConstraint = field.constraint ? false : true;

			for (const type of VALID_TYPES) {
				if (type.test(field.type)) {
					validType = true;
					break;
				}
			}
			if (!validType) {
				res.status(400).send(`${field.type} is not a valid type.`);
			}

			if (field.constraint) {
				for (const constraint of VALID_CONSTRAINTS) {
					if (constraint.test(field.constraint)) {
						validConstraint = true;
						break;
					}
				}
			}
			if (!validConstraint) {
				res.status(400).send(`${field.constraint} is not a valid constraint`);
			}
		}
		next();
	};
}

module.exports = {
	query,
	getTable,
	getTables,
	typeValidator,
	PgError
};
