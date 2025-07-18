"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var { serverURL } = require("../../tools/server.ts");

	var {
		setupTransactionWallet,
		handleTransactionResult,
	} = require("../../tools/helpers.ts");

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
		const userClient: any = new xrpl.Client(serverURL);
		console.info("Connecting to testnet...");
		await userClient.connect();

		const clientWallet: any = (await setupTransactionWallet(userClient))
			.wallet;
		const publicKey: string = clientWallet.publicKey;
		const classicAddress: string = clientWallet.classicAddress;
		const walletSeed: string = clientWallet.seed;

		console.info(`Wallet public key: ${publicKey}`);
		console.info(`Wallet classic address: ${classicAddress}`);
		console.info(`Wallet seed: ${walletSeed}`);

		const ledgerResponse: any = await userClient.request({
			command: "account_info",
			account: clientWallet.address,
			ledger_index: "validated",
		});

		getMainLedgerInfo(ledgerResponse.result);
		getMainAccountBalance(ledgerResponse.result.account_data);

		let result: string | boolean;
		try {
			result = ledgerResponse.result.validated;
			console.info(`Validated: ${result}`);

			handleTransactionResult(result);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}

		userClient.request({
			command: "subscribe",
			streams: ["ledger"],
		});

		console.info("Disconnecting from testnet...");
		userClient.disconnect();
	} catch (error) {
		console.error("There was an error in the main function ❌");
		throw new Error(error);
	}
}
