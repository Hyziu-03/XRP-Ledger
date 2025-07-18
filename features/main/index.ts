"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var server = require("../../tools/server.js");

	var {
		setupWallet,
		handleResult,
	} = require("../../tools/helpers.js");

	var {
		getMainLedgerInfo,
		getMainAccountBalance,
	} = require("./tools/index.ts");

	try {
		getAccountInfo();
	} catch (error) {
		console.error("There was en error in the main function ❌");
		throw new Error(error);
	}
} else {
	console.warn(
		"This script can only be run in Node.js as a module"
	);
}

async function getAccountInfo(): Promise<void> {
	try {
		const client: any = new xrpl.Client(server);
		console.info("Connecting to testnet...");
		await client.connect();

		const wallet: any = (await setupWallet(client)).wallet;
		const publicKey: string = wallet.publicKey;
		const classicAddress: string = wallet.classicAddress;
		const seed: string = wallet.seed;

		console.info(`Wallet public key: ${publicKey}`);
		console.info(`Wallet classic address: ${classicAddress}`);
		console.info(`Wallet seed: ${seed}`);

		const response: any = await client.request({
			command: "account_info",
			account: wallet.address,
			ledger_index: "validated",
		});

		getMainLedgerInfo(response.result);
		getMainAccountBalance(response.result.account_data);

		let result: string | boolean;
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
