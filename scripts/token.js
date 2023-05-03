"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var server = require("../tools/server.js");
	var { setupWallet, handleResult, submitTransaction } = require("../tools/helpers.js");
} else {
	console.log("This script can only be run in Node.js as a module");
}

async function main() {
	try {
		const client = new xrpl.Client(server);
		console.log("Connecting to testnet...");
		await client.connect();

		const hotWallet = (await setupWallet(client)).wallet;
		const coldWallet = (await setupWallet(client)).wallet;

		const coldWalletSettings = {
			TransactionType: "AccountSet",
			Account: coldWallet.address,
			TransferRate: 0,
			TickSize: 5,
			Domain: "6578616D706C652E636F6D",
			SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
			Flags:
				xrpl.AccountSetTfFlags.tfDisallowXRP |
				xrpl.AccountSetTfFlags.tfRequireDestTag,
			// Flags are additional settings for transactions
		};

		console.log("Preparing transaction from cold wallet...");
		const preparedColdWalletSettings = await client.autofill(
			coldWalletSettings
		);
		const signedColdWalletSettings = coldWallet.sign(
			preparedColdWalletSettings
		);

		console.log("Sending transaction from cold wallet...");

		const result = await submitTransaction(client, signedColdWalletSettings.tx_blob);
		handleResult(result);

		const hotWalletSettings = {
			TransactionType: "AccountSet",
			Account: hotWallet.address,
			Domain: "6578616D706C652E636F6D",
			SetFlag: xrpl.AccountSetAsfFlags.asfRequireAuth,
			Flags:
				xrpl.AccountSetTfFlags.tfDisallowXRP |
				xrpl.AccountSetTfFlags.tfRequireDestTag,
		};

		console.log("Preparing transaction from hot wallet...");
		const preparedHotWalletSettings = await client.autofill(
			hotWalletSettings
		);
		const signedHotWalletSettings = hotWallet.sign(
			preparedHotWalletSettings
		);
		console.log("Sending transaction from hot wallet...");

		const result2 = await submitTransaction(client, signedHotWalletSettings.tx_blob);
		handleResult(result2);

		const currencyCode = "FOO";
		const trustLineSettings = {
			TransactionType: "TrustSet",
			Account: hotWallet.address,
			LimitAmount: {
				currency: currencyCode,
				issuer: coldWallet.address,
				value: "1000000000",
			},
		};

		console.log("Preparing trust line...");
		const preparedTrustLineSettings = await client.autofill(
			trustLineSettings
		);
		const signedTrustLineSettings = hotWallet.sign(
			preparedTrustLineSettings
		);
		console.log("Setting up trust line...");

		const result3 = await submitTransaction(client, signedTrustLineSettings.tx_blob);
		handleResult(result3);

		const quantity = "3840";
		const sendingSettings = {
			TransactionType: "Payment",
			Account: coldWallet.address,
			Amount: {
				currency: currencyCode,
				value: quantity,
				issuer: coldWallet.address,
			},
			Destination: hotWallet.address,
			DestinationTag: 1,
		};

		console.log("Preparing transaction...");
		const preparedSendingSettings = await client.autofill(
			sendingSettings
		);
		const signedSendingSettings = coldWallet.sign(
			preparedSendingSettings
		);
		console.log(`Sending ${quantity} ${currencyCode}...`);

		const result4 = await submitTransaction(client, signedSendingSettings.tx_blob); 
		handleResult(result4);

		console.log("Getting hot wallet information...");
		const hotWalletBalance = await client.request({
			command: "account_lines",
			account: hotWallet.address,
			ledger_index: "validated",
		});
		const hotWalletValidation = hotWalletBalance.result.validated;
		handleResult(hotWalletValidation);

		console.log("Getting cold wallet information...");
		const coldWalletBalance = await client.request({
			command: "gateway_balances",
			account: coldWallet.address,
			ledger_index: "validated",
			hotwallet: [hotWallet.address],
		});
		const coldtWalletValidation = coldWalletBalance.result.validated;
		handleResult(coldtWalletValidation);

		console.log("Disconnecting from testnet...");
		client.disconnect();
	} catch (error) {
		console.error("There was an error processing the payment ❌");
		throw new Error(error);
	}
}

main();
