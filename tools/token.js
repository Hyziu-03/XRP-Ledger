"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var { submitTransaction, handleResult } = require("./helpers.js");
} else {
	console.info(
		"This script can only be run in Node.js as a module"
	);
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
	displayKey,
	sendTransactionFromColdWallet,
	sendTransactionFromHotWallet,
	prepareTrustLine,
};
