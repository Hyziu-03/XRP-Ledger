"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var server = require("../../tools/server.js");
	var {
		setupWallet,
		handleResult,
		submitTransaction,
	} = require("../../tools/helpers.js");
	var {
		displayKey,
		sendTransactionFromColdWallet,
		sendTransactionFromHotWallet,
		prepareTrustLine,
	} = require("./tools/index.js");
	var initSettings = require("./tools/flags.js");

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

		const hotWallet = (await setupWallet(client)).wallet;
		const coldWallet = (await setupWallet(client)).wallet;
		const settings = initSettings(coldWallet, hotWallet);

		displayKey("Hot", "public", hotWallet.publicKey);
		displayKey("Cold", "public", coldWallet.publicKey);

		await sendTransactionFromColdWallet(
			client,
			coldWallet,
			settings
		);
		await sendTransactionFromHotWallet(
			client,
			hotWallet,
			settings
		);
		await prepareTrustLine(client, hotWallet, settings);

		const ledgerInfo = await client.getLedgerIndex();
		const preparedSendingSettings = await client.autofill(
			settings.sending
		);
		preparedSendingSettings.LastLedgerSequence = ledgerInfo + 20;

		const signedSendingSettings = coldWallet.sign(
			preparedSendingSettings
		);

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

		const coldWalletBalance = await client.request({
			command: "gateway_balances",
			account: coldWallet.address,
			ledger_index: "validated",
			hotwallet: [hotWallet.address],
		});
		const coldtWalletValidation =
			coldWalletBalance.result.validated;

		try {
			handleResult(coldtWalletValidation);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}
		console.info("Disconnecting from testnet...");
		client.disconnect();
	} catch (error) {
		console.error("There was an error processing the payment ❌");
		throw new Error(error);
	}
}
