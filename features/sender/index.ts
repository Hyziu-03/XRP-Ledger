"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var server = require("../../tools/server.js");
	var {
		submitTransaction,
		handleResult,
	} = require("../../tools/helpers.js");
	var {
		WALLET_SEED: SEED,
		WALLET_DESTINATION_ADDRESS: DESTINATION_ADDRESS,
	} = require("./tools/index.ts");

	try {
		sendToken();
	} catch (error) {
		console.error("There was en error in the main function ❌");
		throw new Error(String(error));
	}
} else {
	console.warn(
		"This script can only be run in Node.js as a module"
	);
}

async function sendToken(): Promise<void> {
	try {
		const client: any = new xrpl.Client(server);
		console.info("Connecting to testnet...");
		await client.connect();

		const wallet: any = xrpl.Wallet.fromSeed(SEED);
		const publicKey: string = wallet.publicKey;
		const address: string = wallet.address;

		console.info("Public Key: ", publicKey);
		console.info("Address: ", address);

		const xrp: any = xrpl.xrpToDrops("1");
		const ledgerInfo: any = await client.getLedgerIndex();

		let details: any;
		try {
			details = await client.autofill({
				TransactionType: "Payment",
				Account: address,
				Amount: xrp,
				Destination: DESTINATION_ADDRESS,
			});
			details.LastLedgerSequence = ledgerInfo + 20;
		} catch (error) {
			console.error(
				"There was an error preparing transaction details ❌"
			);
			throw new Error(String(error));
		}

		console.info(`Cost: ${xrpl.dropsToXrp(details.Fee)} XRP`);
		const signed: any = wallet.sign(details);
		console.info("Hash: ", signed.hash);

		let result: any;
		try {
			result = await submitTransaction(client, signed.tx_blob);
			handleResult(result);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(String(error));
		}

		console.info("Disconnecting from testnet...");
		client.disconnect();
	} catch (error) {
		console.error(
			"There was an error sending the transaction ❌"
		);
		throw new Error(String(error));
	}
}
