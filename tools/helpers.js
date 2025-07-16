"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
} else {
	console.log("This script can only be run in Node.js as a module");
}

async function setupWallet(client, describe = false) {
	try {
		const funding = await client.fundWallet();
		if(describe) console.log("Funding a wallet...");

		const { wallet, balance } = funding;
		const { publicKey, privateKey, classicAddress, seed } =
			wallet;

		if(describe) {
			console.log(`Balance: ${balance} XRP`);
			console.log("Public Key: ", publicKey);
			console.log("Private Key: ", privateKey);
			console.log("Address: ", classicAddress);
			console.log("Seed: ", seed);
			console.log("Funding a wallet...");
		}

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
		if (describe) console.log("Submitting transaction...");
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
	if (result === "tesSUCCESS" || result === true) {
		console.log("Transaction successful ✅");
	} else {
		console.log(`Result: ${result}`);
		console.error("Transaction failed ❌");
	}
}

// Flags are additional settings for transactions
function initSettings(coldWallet, hotWallet) {
	return {
		coldWallet: {
			TransactionType: "AccountSet",
			Account: coldWallet.address,
			TransferRate: 0,
			TickSize: 5,
			Domain: "6578616D706C652E636F6D",
			SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
			Flags:
				xrpl.AccountSetTfFlags.tfDisallowXRP |
				xrpl.AccountSetTfFlags.tfRequireDestTag,
		},
		hotWallet: {
			TransactionType: "AccountSet",
			Account: hotWallet.address,
			Domain: "6578616D706C652E636F6D",
			SetFlag: xrpl.AccountSetAsfFlags.asfRequireAuth,
			Flags:
				xrpl.AccountSetTfFlags.tfDisallowXRP |
				xrpl.AccountSetTfFlags.tfRequireDestTag,
		},
		trustLine: {
			TransactionType: "TrustSet",
			Account: hotWallet.address,
			LimitAmount: {
				currency: "FOO",
				issuer: coldWallet.address,
				value: "1000000000",
			},
		},
		sending: {
			TransactionType: "Payment",
			Account: coldWallet.address,
			Amount: {
				currency: "FOO",
				value: "3840",
				issuer: coldWallet.address,
			},
			Destination: hotWallet.address,
			DestinationTag: 1,
		},
	};
}

function displayKey(type, access, address) {
	console.log(`${type} wallet ${access} key: ${address}`);
}

function displayWalletBalance(type, ID, index, hash) {
	const baseText = "wallet balance";

	console.log(`${type} ${baseText} ID: ${ID}`);
	console.log(`${type} ${baseText} ledger index: ${index}`);
	console.log(`${type} ${baseText} ledger hash: ${hash}`);
}


async function sendTransactionFromColdWallet(
	client,
	coldWallet,
	settings
) {
	console.log("Preparing transaction from cold wallet...");
	const ledgerInfo = await client.getLedgerIndex();
	const preparedColdWalletSettings = await client.autofill(
		settings.coldWallet
	);
	preparedColdWalletSettings.LastLedgerSequence = ledgerInfo + 20;
	
	const signedColdWalletSettings = coldWallet.sign(
		preparedColdWalletSettings
	);
	console.log("Sending transaction from cold wallet...");
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
	console.log(`Transaction hash: ${hash}`);

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
	console.log(`Currency: ${preparedSendingSettingsInfo.currency}`);
	console.log(`Issuer: ${preparedSendingSettingsInfo.issuer}`);
	const signedTrustLineSettingsInfo = {
		hash: signedTrustLineSettings.hash,
	};
	console.log(
		`Transaction hash: ${signedTrustLineSettingsInfo.hash}`
	);
}

module.exports = {
	setupWallet,
	submitTransaction,
	handleResult,
	initSettings,
	displayKey,
	displayWalletBalance,
	sendTransactionFromColdWallet,
	sendTransactionFromHotWallet,
	prepareTrustLine,
};
