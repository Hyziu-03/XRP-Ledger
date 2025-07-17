"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var server = require("../../tools/server.js");

	var {
		setupWallet,
		handleResult,
	} = require("../../tools/helpers.js");

	var {
		getLedgerInfo,
		getAccountBalance,
	} = require("./tools/index.js");

	try {
		main();
	} catch (error) {
		console.error("There was en error in the main function ❌");
		throw new Error(error);
	}
} else {
	console.warn(
		"This script can only be run in Node.js as a module"
	);
}

async function main() {
	try {
		const client = new xrpl.Client(server);
		console.info("Connecting to testnet...");
		await client.connect();

		const wallet = (await setupWallet(client)).wallet;
		const { publicKey, privateKey, classicAddress, seed } =
			wallet;

		console.info(`Wallet public key: ${publicKey}`);
		console.info(`Wallet private key: ${privateKey}`);
		console.info(`Wallet classic address: ${classicAddress}`);
		console.info(`Wallet seed: ${seed}`);

		const response = await client.request({
			command: "account_info",
			account: wallet.address,
			ledger_index: "validated",
		});

		getLedgerInfo(response.result);
		getAccountBalance(response.result.account_data);

		let result;
		try {
			result = response.result.validated;
			console.info(`Validated: ${result}`);

			handleResult(result);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}

		client.request({
			command: "subscribe",
			streams: ["ledger"],
		});

		console.info("Disconnecting from testnet...");
		client.disconnect();
	} catch (error) {
		console.error("There was an error in the main function ❌");
		throw new Error(error);
	}
}
