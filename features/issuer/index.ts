"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var { serverURL } = require("../../tools/server");
	var {
		setupTransactionWallet,
		handleTransactionResult,
		submitTransactionNow,
	} = require("../../tools/helpers");
	var {
		displayWalletKey: displayKey,
		sendTransactionFromColdWalletNow:
			sendTransactionFromColdWallet,
		sendTransactionFromHotWalletNow: sendTransactionFromHotWallet,
		prepareTransactionTrustLine: prepareTrustLine,
	} = require("./tools/index");
	var { initTransactionSettings } = require("./tools/flags");

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
		const userClient: any = new xrpl.Client(serverURL);
		console.info("Connecting to testnet...");
		await userClient.connect();

		const hotWallet: any = (await setupTransactionWallet(userClient))
			.wallet;
		const coldWallet: any = (await setupTransactionWallet(userClient))
			.wallet;
		const transactionSettings: any = initTransactionSettings(
			coldWallet,
			hotWallet
		);

		displayKey("Hot", "public", hotWallet.publicKey);
		displayKey("Cold", "public", coldWallet.publicKey);

		await sendTransactionFromColdWallet(
			userClient,
			coldWallet,
			transactionSettings
		);
		await sendTransactionFromHotWallet(
			userClient,
			hotWallet,
			transactionSettings
		);
		await prepareTrustLine(userClient, hotWallet, transactionSettings);

		const ledgerInfo: any = await userClient.getLedgerIndex();
		const preparedSendingSettings: any = await userClient.autofill(
			transactionSettings.sending
		);
		preparedSendingSettings.LastLedgerSequence = ledgerInfo + 20;

		const signedSendingSettings = coldWallet.sign(
			preparedSendingSettings
		);

		try {
			handleTransactionResult(
				await submitTransactionNow(
					userClient,
					signedSendingSettings.tx_blob
				)
			);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}

		const hotWalletBalance: any = await userClient.request({
			command: "account_lines",
			account: hotWallet.address,
			ledger_index: "validated",
		});
		const hotWalletValidation: boolean | string =
			hotWalletBalance.result.validated;

		try {
			handleTransactionResult(hotWalletValidation);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}

		const coldWalletBalance: any = await userClient.request({
			command: "gateway_balances",
			account: coldWallet.address,
			ledger_index: "validated",
			hotwallet: [hotWallet.address],
		});
		const coldtWalletValidation: boolean | string =
			coldWalletBalance.result.validated;

		try {
			handleTransactionResult(coldtWalletValidation);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}
		console.info("Disconnecting from testnet...");
		userClient.disconnect();
	} catch (error) {
		console.error("There was an error processing the payment ❌");
		throw new Error(error);
	}
}
