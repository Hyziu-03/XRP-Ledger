"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var server = require("../tools/server.js");
	var { 
		setupWallet, 
		handleResult, 
		submitTransaction,
		initSettings,
		displayKey,
		displayWalletBalance,
		sendTransactionFromColdWallet,
		sendTransactionFromHotWallet,
		prepareTrustLine
	} = require("../tools/helpers.js");
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

		const hotWallet = (await setupWallet(client)).wallet;
		const coldWallet = (await setupWallet(client)).wallet;
		const settings = initSettings(coldWallet, hotWallet);

		displayKey("Hot", "public", hotWallet.publicKey);
		displayKey("Hot", "private", hotWallet.privateKey);
		displayKey("Cold", "public", coldWallet.publicKey);
		displayKey("Cold", "private", coldWallet.privateKey);
		
		sendTransactionFromColdWallet(client, coldWallet, settings);
		sendTransactionFromHotWallet(client, hotWallet, settings);
		prepareTrustLine(client, hotWallet);

		console.log("Preparing transaction...");
		const preparedSendingSettings = await client.autofill(
			settings.sending
		);
		const signedSendingSettings = coldWallet.sign(
			preparedSendingSettings
		);
		console.log(`Sending 3840 FOO...`);
		try {
			handleResult(
				await submitTransaction(
					client,
					signedSendingSettings.tx_blob
				)
			);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}
		console.log("Getting hot wallet information...");
		const hotWalletBalance = await client.request({
			command: "account_lines",
			account: hotWallet.address,
			ledger_index: "validated",
		});
		const hotWalletValidation = hotWalletBalance.result.validated;
		try {
			handleResult(hotWalletValidation);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}
		const hotWalletBalanceInfo = {
			id: hotWalletBalance.id,
			ledger_index: hotWalletBalance.result.ledger_index,
			ledger_hash: hotWalletBalance.result.ledger_hash,
		}
		displayWalletBalance(
			"Hot", 
			hotWalletBalanceInfo.id, 
			hotWalletBalanceInfo.ledger_index, 
			hotWalletBalanceInfo.ledger_hash
		);
		console.log("Getting cold wallet information...");
		const coldWalletBalance = await client.request({
			command: "gateway_balances",
			account: coldWallet.address,
			ledger_index: "validated",
			hotwallet: [hotWallet.address],
		});
		const coldtWalletValidation = coldWalletBalance.result.validated;
		try {
			handleResult(coldtWalletValidation);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}
		const coldWalletBalanceInfo = {
			id: coldWalletBalance.id,
			ledger_index: coldWalletBalance.result.ledger_index,
			ledger_hash: coldWalletBalance.result.ledger_hash,
		}
		displayWalletBalance(
			"Cold", 
			coldWalletBalanceInfo.id, 
			coldWalletBalanceInfo.ledger_index, 
			coldWalletBalanceInfo.ledger_hash
		);
		console.log("Disconnecting from testnet...");
		client.disconnect();
	} catch (error) {
		console.error("There was an error processing the payment ❌");
		throw new Error(error);
	}
}

main();
