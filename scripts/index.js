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
		const { feeCushion, maxFeeXRP } = client;
		console.log(`Fee cushion: ${feeCushion}`);
		console.log(`Max fee in XRP: ${maxFeeXRP}`);
		await client.connect();

		const wallet = (await setupWallet(client)).wallet;
		const { publicKey, privateKey, classicAddress, seed } = wallet;
		console.log(`Wallet public key: ${publicKey}`);
		console.log(`Wallet private key: ${privateKey}`);
		console.log(`Wallet classic address: ${classicAddress}`);
		console.log(`Wallet seed: ${seed}`);

		console.log("Requesting account information...");
		const response = await client.request({
			command: "account_info",
			account: wallet.address,
			ledger_index: "validated",
		});

		const accountData = response.result.account_data;
		const { 
			Account, 
			LedgerEntryType, 
			PreviousTxnID, 
			PreviousTxnLgrSeq, 
			Sequence, 
			index 
		} = accountData;
		console.log(`Account: ${Account}`);
		console.log(`Ledger entry type: ${LedgerEntryType}`);
		console.log(`Previous transaction ID: ${PreviousTxnID}`);
		console.log(`Previous transaction ledger sequence: ${PreviousTxnLgrSeq}`);
		console.log(`Sequence: ${Sequence}`);
		console.log(`Index: ${index}`);

		const ledgerHash = response.result.ledger_hash;
		console.log(`Ledger hash: ${ledgerHash}`);
		const ledgerIndex = response.result.ledger_index;
		console.log(`Ledger index: ${ledgerIndex}`);
		const validated = response.result.validated;
		console.log(`Validated: ${validated}`);

		const balance = response.result.account_data.Balance;
		console.log(
			`Your balance is: ${xrpl.dropsToXrp(balance)} XRP`
		);
		const result = response.result.validated;
		try {
			handleResult(result);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}
		console.log(`Is the result validated? ${result}`);

		console.log("Subscribing to the ledger...");
		client.request({
			command: "subscribe",
			streams: ["ledger"],
		});

		console.log("Disconnecting from testnet...");
		client.disconnect();
	} catch (error) {
		console.error("There was an error in the main function ❌");
		throw new Error(error);
	}
}

main();
