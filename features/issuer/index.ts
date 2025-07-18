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
		displayWalletKey: displayKey,
		sendTransactionFromColdWalletNow:
			sendTransactionFromColdWallet,
		sendTransactionFromHotWalletNow: sendTransactionFromHotWallet,
		prepareTransactionTrustLine: prepareTrustLine,
	} = require("./tools/index");
	var initSettings = require("./tools/flags");

	try {
		issueCurrency();
	} catch (error) {
		console.error("There was en error in the main function ❌");
		throw new Error(error);
	}
} else {
	console.warn(
		"This script can only be run in Node.js as a module"
	);
}

async function issueCurrency(): Promise<void> {
	try {
		const client: any = new xrpl.Client(server);
		console.info("Connecting to testnet...");
		await client.connect();

		const hotWallet: any = (await setupWallet(client)).wallet;
		const coldWallet: any = (await setupWallet(client)).wallet;
		const settings: any = initSettings(coldWallet, hotWallet);

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

		const ledgerInfo: any = await client.getLedgerIndex();
		const preparedSendingSettings: any = await client.autofill(
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

		const hotWalletBalance: any = await client.request({
			command: "account_lines",
			account: hotWallet.address,
			ledger_index: "validated",
		});
		const hotWalletValidation: boolean | string =
			hotWalletBalance.result.validated;

		try {
			handleResult(hotWalletValidation);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}

		const coldWalletBalance: any = await client.request({
			command: "gateway_balances",
			account: coldWallet.address,
			ledger_index: "validated",
			hotwallet: [hotWallet.address],
		});
		const coldtWalletValidation: boolean | string =
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
