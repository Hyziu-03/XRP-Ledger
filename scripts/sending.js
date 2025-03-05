"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var server = require("../tools/server.js");
	var { submitTransaction, handleResult } = require("../tools/helpers.js");
} else {
	console.log("This script can only be run in Node.js as a module");
}

const SEED = "shRvy2jLMHYNNwLjBHF85RnMAGSuB";
const DESTINATION_ADDRESS = "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59";

async function main() {
	try {
		const client = new xrpl.Client(server);
		console.log("Connecting to testnet...");
		const { feeCushion, maxFeeXRP } = client;
		console.log(`Fee cushion: ${feeCushion}`);
		console.log(`Max fee in XRP: ${maxFeeXRP}`);
		await client.connect();

		console.log("Setting up wallet from seed...");
		const wallet = xrpl.Wallet.fromSeed(SEED);
		const { publicKey, privateKey, address } = wallet;
		console.log("Public Key: ", publicKey);
		console.log("Private Key: ", privateKey);
		console.log("Address: ", address);

		const xrp = xrpl.xrpToDrops("10");
		console.log("Preparing transaction details...");
		const details = await client.autofill({
			TransactionType: "Payment",
			Account: address,
			Amount: xrp,
			Destination: DESTINATION_ADDRESS,
		});
		const {
			Account,
			Amount,
			Destination,
			TransactionType,
			LastLedgerSequence,
		} = details;
		console.log("Account: ", Account);
		console.log(`Amount: ${xrpl.dropsToXrp(Amount)} XRP`);
		console.log("Destination: ", Destination);
		console.log("Transaction type: ", TransactionType);
		console.log("Last ledger sequence: ", LastLedgerSequence);

		const ledger = details.LastLedgerSequence;
		console.log(`Cost: ${xrpl.dropsToXrp(details.Fee)} XRP`);
		console.log("Expires after last ledger sequence: ", ledger);

		console.log("Signing transaction...");
		const signed = wallet.sign(details);
		console.log("Hash: ", signed.hash);
		console.log("Blob: ", signed.tx_blob);

		const result = await submitTransaction(client, signed.tx_blob);
		try {
			handleResult(result);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}
		console.log(`Is the result validated? ${result}`);
		console.log("Disconnecting from testnet...");
		client.disconnect();
	} catch (error) {
		console.error(
			"There was an error sending the transaction ❌"
		);
		throw new Error(error);
	}
}

main();
