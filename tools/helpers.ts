"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
} else {
	console.info(
		"This script can only be run in Node.js as a module"
	);
}

export async function setupTransactionWallet(
	client: any
): Promise<any> {
	try {
		const funding: any = await client.fundWallet();
		const wallet: any = funding.wallet;
		const balance: any = funding.balance;
		const publicKey: string = wallet.publicKey;
		const classicAddress: string = wallet.classicAddress;
		const seed: string = wallet.seed;

		console.info(`Balance: ${balance} XRP`);
		console.info("Public Key: ", publicKey);
		console.info("Address: ", classicAddress);
		console.info("Seed: ", seed);

		return {
			wallet: wallet,
			balance: balance,
			publicKey: publicKey,
			address: classicAddress,
			seed: seed,
		};
	} catch (error) {
		console.error("There was an error funding the wallet ❌");
		throw new Error(error);
	}
}

export async function submitTransactionNow(
	client: any,
	blob: any
): Promise<string> {
	try {
		const transaction: any = await client.submitAndWait(blob);
		return transaction.result.meta.TransactionResult;
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
