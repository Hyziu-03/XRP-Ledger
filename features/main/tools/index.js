"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
} else {
	console.info(
		"This script can only be run in Node.js as a module"
	);
}

function getLedgerInfo(result) {
	const ledgerHash = result.ledger_hash;
	console.info(`Ledger hash: ${ledgerHash}`);

	const ledgerIndex = result.ledger_index;
	console.info(`Ledger index: ${ledgerIndex}`);
}

function getAccountBalance(account_data) {
	const balance = account_data.Balance;
	console.info(`Your balance is: ${xrpl.dropsToXrp(balance)} XRP`);
}

module.exports = {
	getLedgerInfo,
	getAccountBalance,
};
