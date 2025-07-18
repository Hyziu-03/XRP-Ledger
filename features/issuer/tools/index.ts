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
	userClient: any,
	coldWallet: any,
	transactionSettings: any
): Promise<void> {
	try {
		const ledgerInfo: any = await userClient.getLedgerIndex();
		const preparedColdWalletSettings: any = await userClient.autofill(
			transactionSettings.coldWallet
		);
		preparedColdWalletSettings.LastLedgerSequence =
			ledgerInfo + 20;
		const signedColdWalletSettings: any = coldWallet.sign(
			preparedColdWalletSettings
		);

		try {
			handleTransactionResult(
				await submitTransactionNow(
					userClient,
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
	userClient: any,
	hotWallet: any,
	transactionSettings: any
): Promise<void> {
	const ledgerInfo: any = await userClient.getLedgerIndex();
	const preparedHotWalletSettings: any = await userClient.autofill(
		transactionSettings.hotWallet
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
				userClient,
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
	userClient: any,
	hotWallet: any,
	transactionSettings: any
): Promise<void> {
	const ledgerInfo: any = await userClient.getLedgerIndex();
	const preparedTrustLineSettings: any = await userClient.autofill(
		transactionSettings.trustLine
	);
	preparedTrustLineSettings.LastLedgerSequence = ledgerInfo + 20;
	const signedTrustLineSettings: any = hotWallet.sign(
		preparedTrustLineSettings
	);

	try {
		handleTransactionResult(
			await submitTransactionNow(
				userClient,
				signedTrustLineSettings.tx_blob
			)
		);
	} catch (error) {
		console.error(
			"There was an error handling the transaction result ❌"
		);
		throw new Error(error);
	}

	const exchangedCurrency: string =
		preparedTrustLineSettings.LimitAmount.currency;
	const currencyIssuer: string =
		preparedTrustLineSettings.LimitAmount.issuer;

	console.info(`Currency: ${exchangedCurrency}`);
	console.info(`Issuer: ${currencyIssuer}`);

	const trustLineTransactionHash: string =
		signedTrustLineSettings.hash;

	console.info(`Transaction hash: ${trustLineTransactionHash}`);
}
