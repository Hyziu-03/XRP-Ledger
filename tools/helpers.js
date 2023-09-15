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
	try {
		if (result === "tesSUCCESS" || result === true) {
			console.log("Transaction successful ✅");
		} else {
			console.log(`Result: ${result}`);
			console.error("Transaction failed ❌");
		}
	} catch (error) {
		console.error(
			"There was an error handling the transaction result ❌"
		);
		throw new Error(error);
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

module.exports = {
	setupWallet,
	submitTransaction,
	handleResult,
	initSettings,
};
