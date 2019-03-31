function parseUrl(url) {
	let tokens = url.split('/');

	// remove the api identifier and empty string
	tokens = tokens.slice(3);

	// if no collection is specified, return empty array
	if (!tokens) {
		return tokens;
	}

	// find start of query filters in last element
	const queryIndex = tokens[tokens.length - 1].indexOf('?');

	// if there is no filter, return the array
	if (queryIndex === -1) {
		return tokens;
	}

	// if there are filter params, remove them
	tokens[tokens.length - 1] = tokens[tokens.length - 1].substring(0, queryIndex);

	return tokens;
}

module.exports = { parseUrl };