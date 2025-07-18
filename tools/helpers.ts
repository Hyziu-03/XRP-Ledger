"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
} else {
	console.info(
		"This script can only be run in Node.js as a module"
	);
}

export async function setupTransactionWallet(
	userClient: any
): Promise<any> {
	try {
		const walletFunding: any = await userClient.fundWallet();
		const clientWallet: any = walletFunding.wallet;
		const accountBalance: any = walletFunding.balance;
		const publicKey: string = clientWallet.publicKey;
		const classicAddress: string = clientWallet.classicAddress;
		const walletSeed: string = clientWallet.seed;

		console.info(`Balance: ${accountBalance} XRP`);
		console.info("Public Key: ", publicKey);
		console.info("Address: ", classicAddress);
		console.info("Seed: ", walletSeed);

		return {
			wallet: clientWallet,
			balance: accountBalance,
			publicKey: publicKey,
			address: classicAddress,
			seed: walletSeed,
		};
	} catch (error) {
		console.error("There was an error funding the wallet ❌");
		throw new Error(error);
	}
}

export async function submitTransactionNow(
	userClient: any,
	blob: any
): Promise<string> {
	try {
		const transactionBlob: any = await userClient.submitAndWait(blob);
		return transactionBlob.result.meta.TransactionResult;
	} catch (error) {
		console.error(
			"There was an error submitting the transaction ❌"
		);
		throw new Error(error);
	}
}

export function handleTransactionResult(
	result: boolean | string
): void {
	result === "tesSUCCESS" || result === true
		? console.info("Transaction successful ✅")
		: console.error(`Result: ${result} \nTransaction failed ❌`);
}
