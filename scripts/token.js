"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var server = require("../tools/server.js");
	var { 
		setupWallet, 
		handleResult, 
		submitTransaction,
		initSettings,
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
		console.log(`Hot wallet public key: ${hotWallet.publicKey}`);
		console.log(`Hot wallet private key: ${hotWallet.privateKey}`);
		console.log(`Cold wallet public key: ${coldWallet.publicKey}`);
		console.log(`Cold wallet private key: ${coldWallet.privateKey}`);
		
		console.log("Preparing transaction from cold wallet...");
		const preparedColdWalletSettings = await client.autofill(
			settings.coldWallet
		);
		const signedColdWalletSettings = coldWallet.sign(
			preparedColdWalletSettings
		);
		console.log("Sending transaction from cold wallet...");
		handleResult(await submitTransaction(
			client, signedColdWalletSettings.tx_blob
		));
		console.log("Preparing transaction from hot wallet...");
		const preparedHotWalletSettings = await client.autofill(
			settings.hotWallet
		);
		const signedHotWalletSettings = hotWallet.sign(
			preparedHotWalletSettings
		);
		const { hash } = signedHotWalletSettings;
		console.log(`Transaction hash: ${hash}`);
		console.log("Sending transaction from hot wallet...");
		handleResult(await submitTransaction(
			client, signedHotWalletSettings.tx_blob
		));

		console.log("Preparing trust line...");
		const preparedTrustLineSettings = await client.autofill(
			settings.trustLine
		);
		const signedTrustLineSettings = hotWallet.sign(
			preparedTrustLineSettings
		);
		console.log("Setting up trust line...");
		handleResult(await submitTransaction(
			client, signedTrustLineSettings.tx_blob
		));

		const preparedSendingSettingsInfo = {
			currency: preparedTrustLineSettings.LimitAmount.currency,
			issuer: preparedTrustLineSettings.LimitAmount.issuer,
		}
		console.log(`Currency: ${preparedSendingSettingsInfo.currency}`);
		console.log(`Issuer: ${preparedSendingSettingsInfo.issuer}`);
		const signedTrustLineSettingsInfo = {
			hash: signedTrustLineSettings.hash,
		}
		console.log(`Transaction hash: ${signedTrustLineSettingsInfo.hash}`);

		console.log("Preparing transaction...");
		const preparedSendingSettings = await client.autofill(
			settings.sending
		);
		const signedSendingSettings = coldWallet.sign(
			preparedSendingSettings
		);
		console.log(`Sending 3840 FOO...`);
		handleResult(await submitTransaction(
			client, signedSendingSettings.tx_blob
		));

		console.log("Getting hot wallet information...");
		const hotWalletBalance = await client.request({
			command: "account_lines",
			account: hotWallet.address,
			ledger_index: "validated",
		});
		const hotWalletValidation = hotWalletBalance.result.validated;
		handleResult(hotWalletValidation);

		const hotWalletBalanceInfo = {
			id: hotWalletBalance.id,
			ledger_index: hotWalletBalance.result.ledger_index,
			ledger_hash: hotWalletBalance.result.ledger_hash,
		}
		console.log(`Hot wallet balance ID: ${hotWalletBalanceInfo.id}`);
		console.log(`Hot wallet balance ledger index: ${hotWalletBalanceInfo.ledger_index}`);
		console.log(`Hot wallet balance ledger hash: ${hotWalletBalanceInfo.ledger_hash}`);

		console.log("Getting cold wallet information...");
		const coldWalletBalance = await client.request({
			command: "gateway_balances",
			account: coldWallet.address,
			ledger_index: "validated",
			hotwallet: [hotWallet.address],
		});
		const coldtWalletValidation = coldWalletBalance.result.validated;
		handleResult(coldtWalletValidation);

		const coldWalletBalanceInfo = {
			id: coldWalletBalance.id,
			ledger_index: coldWalletBalance.result.ledger_index,
			ledger_hash: coldWalletBalance.result.ledger_hash,
		}
		console.log(`Cold wallet balance ID: ${coldWalletBalanceInfo.id}`);
		console.log(`Cold wallet balance ledger index: ${coldWalletBalanceInfo.ledger_index}`);
		console.log(`Cold wallet balance ledger hash: ${coldWalletBalanceInfo.ledger_hash}`);
		console.log("Disconnecting from testnet...");
		client.disconnect();
	} catch (error) {
		console.error("There was an error processing the payment ❌");
		throw new Error(error);
	}
}

main();
