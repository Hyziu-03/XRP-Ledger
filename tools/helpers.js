"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
} else {
	console.info(
		"This script can only be run in Node.js as a module"
	);
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

async function submitTransaction(client, blob) {
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

module.exports = {
	setupWallet,
	submitTransaction,
	handleResult,
};
