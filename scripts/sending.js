"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var server = require("../tools/server.js");
	var { submitTransaction, handleResult } = require("../tools/helpers.js");
} else {
	console.warn("This script can only be run in Node.js as a module");
}

const SEED = "shRvy2jLMHYNNwLjBHF85RnMAGSuB";
const DESTINATION_ADDRESS = "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59";

async function main() {
	try {
		const client = new xrpl.Client(server);
		console.info("Connecting to testnet...");
		const { feeCushion, maxFeeXRP } = client;
		console.info(`Max fee in XRP: ${maxFeeXRP}`);
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
		console.info("Blob: ", signed.tx_blob);

		const result = await submitTransaction(client, signed.tx_blob);
		try {
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

main();
