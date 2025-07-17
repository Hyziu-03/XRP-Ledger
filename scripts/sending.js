"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var server = require("../tools/server.js");
	var {
		submitTransaction,
		handleResult,
	} = require("../tools/helpers.js");
	var { SEED, DESTINATION_ADDRESS } = require("../tools/const.js");
	
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

		const wallet = xrpl.Wallet.fromSeed(SEED);
		const { publicKey, privateKey, address } = wallet;
		
		console.info("Public Key: ", publicKey);
		console.info("Private Key: ", privateKey);
		console.info("Address: ", address);

		const xrp = xrpl.xrpToDrops("1");
		const ledgerInfo = await client.getLedgerIndex();
		
		let details;
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
			throw new Error(error);
		}

		console.info(`Cost: ${xrpl.dropsToXrp(details.Fee)} XRP`);
		const signed = wallet.sign(details);
		console.info("Hash: ", signed.hash);
		
		let result;
		try {
			result = await submitTransaction(
				client,
				signed.tx_blob
			);
			handleResult(result);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}
		
		console.info("Disconnecting from testnet...");
		client.disconnect();
	} catch (error) {
		console.error(
			"There was an error sending the transaction ❌"
		);
		throw new Error(error);
	}
}
