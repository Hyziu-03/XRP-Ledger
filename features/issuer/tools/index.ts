"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var {
		submitTransactionNow,
		handleTransactionResult,
	} = require("../../../tools/helpers.ts");
} else {
	console.info(
		"This script can only be run in Node.js as a module"
	);
}

export function displayWalletKey(
	type: string,
	access: string,
	address: string
): void {
	console.info(`${type} wallet ${access} key: ${address}`);
}

export async function sendTransactionFromColdWalletNow(
	client: any,
	coldWallet: any,
	settings: any
): Promise<void> {
	try {
		const ledgerInfo: any = await client.getLedgerIndex();
		const preparedColdWalletSettings: any = await client.autofill(
			settings.coldWallet
		);
		preparedColdWalletSettings.LastLedgerSequence =
			ledgerInfo + 20;
		const signedColdWalletSettings: any = coldWallet.sign(
			preparedColdWalletSettings
		);

		try {
			handleTransactionResult(
				await submitTransactionNow(
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

export async function sendTransactionFromHotWalletNow(
	client: any,
	hotWallet: any,
	settings: any
): Promise<void> {
	const ledgerInfo: any = await client.getLedgerIndex();
	const preparedHotWalletSettings: any = await client.autofill(
		settings.hotWallet
	);
	preparedHotWalletSettings.LastLedgerSequence = ledgerInfo + 20;

	const signedHotWalletSettings: any = hotWallet.sign(
		preparedHotWalletSettings
	);
	const transactionHash: string = signedHotWalletSettings.hash;
	console.info(`Transaction hash: ${transactionHash}`);

	try {
		handleTransactionResult(
			await submitTransactionNow(
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

export async function prepareTransactionTrustLine(
	client: any,
	hotWallet: any,
	settings: any
): Promise<void> {
	const ledgerInfo: any = await client.getLedgerIndex();
	const preparedTrustLineSettings: any = await client.autofill(
		settings.trustLine
	);
	preparedTrustLineSettings.LastLedgerSequence = ledgerInfo + 20;
	const signedTrustLineSettings: any = hotWallet.sign(
		preparedTrustLineSettings
	);

	try {
		handleTransactionResult(
			await submitTransactionNow(
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

	const currency: string =
		preparedTrustLineSettings.LimitAmount.currency;
	const issuer: string =
		preparedTrustLineSettings.LimitAmount.issuer;

	console.info(`Currency: ${currency}`);
	console.info(`Issuer: ${issuer}`);

	const trustLineTransactionHash: string =
		signedTrustLineSettings.hash;

	console.info(`Transaction hash: ${trustLineTransactionHash}`);
}
