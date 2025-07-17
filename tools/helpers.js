"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
} else {
	console.info("This script can only be run in Node.js as a module");
}

async function setupWallet(client) {
	try {
		const funding = await client.fundWallet();

		const { wallet, balance } = funding;
		const { publicKey, privateKey, classicAddress, seed } =
			wallet;

		console.info(`Balance: ${balance} XRP`);
		console.info("Public Key: ", publicKey);
		console.info("Private Key: ", privateKey);
		console.info("Address: ", classicAddress);
		console.info("Seed: ", seed);

		return {
			wallet: wallet,
			balance: balance,
			publicKey: publicKey,
			privateKey: privateKey,
			address: classicAddress,
			seed: seed,
		};
	} catch (error) {
		console.error("There was an error funding the wallet ❌");
		throw new Error(error);
	}
}

async function submitTransaction(client, blob, describe = false) {
	try {
		const transaction = await client.submitAndWait(blob);
		return transaction.result.meta.TransactionResult;
	} catch (error) {
		console.error(
			"There was an error submitting the transaction ❌"
		);
		throw new Error(error);
	}
}

function handleResult(result) {
	result === "tesSUCCESS" || result === true
		? console.info("Transaction successful ✅")
		: console.error(`Result: ${result} \nTransaction failed ❌"`);
}

function displayKey(type, access, address) {
	console.info(`${type} wallet ${access} key: ${address}`);
}

async function sendTransactionFromColdWallet(
	client,
	coldWallet,
	settings
) {
	try {
		const ledgerInfo = await client.getLedgerIndex();
		const preparedColdWalletSettings = await client.autofill(
			settings.coldWallet
		);
		preparedColdWalletSettings.LastLedgerSequence =
			ledgerInfo + 20;

		const signedColdWalletSettings = coldWallet.sign(
			preparedColdWalletSettings
		);
		try {
			handleResult(
				await submitTransaction(
					client,
					signedColdWalletSettings.tx_blob
				)
			);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(error);
		}
	} catch (error) {
		console.error(
			"There was an error preparing the transaction from cold wallet ❌"
		);
		throw new Error(error);
	}
}

async function sendTransactionFromHotWallet(
	client,
	hotWallet,
	settings
) {
	const ledgerInfo = await client.getLedgerIndex();
	const preparedHotWalletSettings = await client.autofill(
		settings.hotWallet
	);
	preparedHotWalletSettings.LastLedgerSequence = ledgerInfo + 20;

	const signedHotWalletSettings = hotWallet.sign(
		preparedHotWalletSettings
	);
	const { hash } = signedHotWalletSettings;
	console.info(`Transaction hash: ${hash}`);

	try {
		handleResult(
			await submitTransaction(
				client,
				signedHotWalletSettings.tx_blob
			)
		);
	} catch (error) {
		console.error(
			"There was an error handling the transaction result ❌"
		);
		throw new Error(error);
	}
}

async function prepareTrustLine(client, hotWallet, settings) {
	const ledgerInfo = await client.getLedgerIndex();
	const preparedTrustLineSettings = await client.autofill(
		settings.trustLine
	);
	preparedTrustLineSettings.LastLedgerSequence = ledgerInfo + 20;

	const signedTrustLineSettings = hotWallet.sign(
		preparedTrustLineSettings
	);

	try {
		handleResult(
			await submitTransaction(
				client,
				signedTrustLineSettings.tx_blob
			)
		);
	} catch (error) {
		console.error(
			"There was an error handling the transaction result ❌"
		);
		throw new Error(error);
	}

	const preparedSendingSettingsInfo = {
		currency: preparedTrustLineSettings.LimitAmount.currency,
		issuer: preparedTrustLineSettings.LimitAmount.issuer,
	};
	console.info(`Currency: ${preparedSendingSettingsInfo.currency}`);
	console.info(`Issuer: ${preparedSendingSettingsInfo.issuer}`);
	const signedTrustLineSettingsInfo = {
		hash: signedTrustLineSettings.hash,
	};
	console.info(
		`Transaction hash: ${signedTrustLineSettingsInfo.hash}`
	);
}

module.exports = {
	setupWallet,
	submitTransaction,
	handleResult,
	displayKey,
	sendTransactionFromColdWallet,
	sendTransactionFromHotWallet,
	prepareTrustLine,
};
