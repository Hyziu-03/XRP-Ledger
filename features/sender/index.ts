"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var { serverURL } = require("../../tools/server");
	var {
		submitTransactionNow,
		handleTransactionResult,
	} = require("../../tools/helpers");
	var {
		WALLET_SEED: SEED,
		WALLET_DESTINATION_ADDRESS: DESTINATION_ADDRESS,
	} = require("./tools/index");

	try {
		sendToken();
	} catch (error) {
		console.error("There was en error in the main function ❌");
		throw new Error(String(error));
	}
} else {
	console.warn(
		"This script can only be run in Node.js as a module"
	);
}

async function sendToken(): Promise<void> {
	try {
		const userClient: any = new xrpl.Client(serverURL);
		console.info("Connecting to testnet...");
		await userClient.connect();

		const clientWallet: any = xrpl.Wallet.fromSeed(SEED);
		const publicKey: string = clientWallet.publicKey;
		const clientAddress: string = clientWallet.address;

		console.info("Public Key: ", publicKey);
		console.info("Address: ", clientAddress);

		const xrpAmount: any = xrpl.xrpToDrops("1");
		const ledgerInfo: any = await userClient.getLedgerIndex();

		let details: any;
		try {
			details = await userClient.autofill({
				TransactionType: "Payment",
				Account: clientAddress,
				Amount: xrpAmount,
				Destination: DESTINATION_ADDRESS,
			});
			details.LastLedgerSequence = ledgerInfo + 20;
		} catch (error) {
			console.error(
				"There was an error preparing transaction details ❌"
			);
			throw new Error(String(error));
		}

		console.info(`Cost: ${xrpl.dropsToXrp(details.Fee)} XRP`);
		const signedTransactionStatus: any = clientWallet.sign(details);
		console.info("Hash: ", signedTransactionStatus.hash);

		let result: any;
		try {
			result = await submitTransactionNow(
				userClient,
				signedTransactionStatus.tx_blob
			);
			handleTransactionResult(result);
		} catch (error) {
			console.error(
				"There was an error handling the transaction result ❌"
			);
			throw new Error(String(error));
		}

		console.info("Disconnecting from testnet...");
		userClient.disconnect();
	} catch (error) {
		console.error(
			"There was an error sending the transaction ❌"
		);
		throw new Error(String(error));
	}
}
