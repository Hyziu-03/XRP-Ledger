"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var server = require("../tools/server.js");
	var { setupWallet, handleResult } = require("../tools/helpers.js");
} else {
	console.log("This script can only be run in Node.js as a module");
}

async function main() {
	try {
		const client = new xrpl.Client(server);
		console.log("Connecting to testnet...");
		await client.connect();

		const wallet = (await setupWallet(client)).wallet;
		console.log("Requesting account information...");
		const response = await client.request({
			command: "account_info",
			account: wallet.address,
			ledger_index: "validated",
		});

		const balance = response.result.account_data.Balance;
		console.log(
			`Your balance is: ${xrpl.dropsToXrp(balance)} XRP`
		);
		const result = response.result.validated;
		handleResult(result);

		console.log("Subscribing to the ledger...");
		client.request({
			command: "subscribe",
			streams: ["ledger"],
		});

		console.log("Validating ledger...");
		client.on("ledgerClosed", async function (ledger) {
			const index = ledger.ledger_index;
			const transactionCount = ledger.txn_count;

			console.log(
				`Ledger validated with ${transactionCount} transactions ✅`
			);
			console.log(`Index: ${index}`);
		});

		console.log("Disconnecting from testnet...");
		client.disconnect();
	} catch (error) {
		console.error("There was an error in the main function ❌");
		throw new Error(error);
	}
}

main();
