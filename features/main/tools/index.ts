"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
} else {
	console.info(
		"This script can only be run in Node.js as a module"
	);
}

export function getMainLedgerInfo(result: {
	ledger_hash: string;
	ledger_index: string;
}): void {
	const ledgerHash = result.ledger_hash;
	console.info(`Ledger hash: ${ledgerHash}`);

	const ledgerIndex = result.ledger_index;
	console.info(`Ledger index: ${ledgerIndex}`);
}

export function getMainAccountBalance(account_data: {
	Balance: string;
}): void {
	const balance = account_data.Balance;
	console.info(`Your balance is: ${xrpl.dropsToXrp(balance)} XRP`);
}
