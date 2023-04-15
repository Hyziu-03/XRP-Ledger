const xrpl = require("xrpl");
const server = require("./server.js");
const Big = require("big.js");
require("dotenv").config();

async function main() {
	const client = new xrpl.Client(server);
	console.log("Connecting to testnet...");
	await client.connect();

	const wallet = (await client.fundWallet()).wallet;
	const { publicKey, privateKey, address, seed } = wallet;

	const we_want = {
		currency: "TST",
		issuer: process.env.DEX_ISSUER,
		value: "25",
	};
	const we_spend = {
		currency: "XRP",
		value: xrpl.xrpToDrops(25 * 10 * 1.15),
		// The formula is as follows:
		// 25 TST * 10 XRP per TST * 15% financial exchange cost
	};
	const quality = new Big(we_spend.value) / new Big(we_want.value);

	const orderbookResponse = await client.request({
		command: "book_offers",
		taker: address,
		ledger_index: "current",
		taker_gets: we_want,
		taker_pays: we_spend,
	});
	console.log("Waiting for orderbook response...");
	const response = JSON.stringify(orderbookResponse.result, null, 2)
	console.log(response);

	const amountWanted = new Big(we_want.value);
	let runningTotalAmount = new Big(0);

	const offers = orderbookResponse.result.offers;
	if (!offers) {
		console.log("No offers found in orderbook.");
	} else {
		const currency = we_want.currency;

		for (const offer of offers) {
			if (offer.quality <= quality) {
				const ownerFunds = offer.owner_funds;
				console.log(
					`Found offer funded with ${ownerFunds} ${currency}.`
				);

				runningTotalAmount = runningTotalAmount.plus(
					new Big(offer.owner_funds)
				);
				if (runningTotalAmount >= amountWanted) {
					console.log(
						"Found enough offers to fulfill order."
					);
					break;
				}
			} else {
				console.log(
					"Remaining offers are too expensive to fulfill the order."
				);
				break;
			}

			const totalAmountMatched = Math.min(
				runningTotalAmount,
				amountWanted
			);
			console.log(
				`Total amount matched: ${totalAmountMatched} ${currency}`
			);
			if (
				runningTotalAmount > 0 &&
				runningTotalAmount < amountWanted
			) {
				const remainingMoney =
					amountWanted - runningTotalAmount;
				console.log(
					`Remaining ${remainingMoney} ${currency} 
					will be placed at the top of the orderbook.`
				);
			}

			if (runningTotalAmount == 0) {
				const quality =
					new Big(we_want.value) / new Big(we_spend.value);

				const orderbookResponse2 = await client.request({
					command: "book_offers",
					taker: address,
					ledger_index: "current",
					taker_gets: we_spend,
					taker_pays: we_want,
				});
				console.log("Waiting for orderbook response...");
				const response = JSON.stringify(orderbookResponse2.result, null, 2)
				console.log(response);

				const offers2 = orderbookResponse2.result.offers;

				let tallyCurrency = we_spend.currency;
				if (tallyCurrency == "XRP")
					tallyCurrency = "drops of XRP";

				let runningTotalAmount = 0;
				if (!offers2) {
					console.log(
						`No simmilar offers found in the orderbook.`
					);
				} else {
					for (const offer of offers2) {
						if (offer.quality <= quality) {
							console.log(
								`Existing offer found, 
								funded with ${offer.owner_funds} ${tallyCurrency}`
							);
							runningTotalAmount =
								runningTotalAmount.plus(
									new Big(offer.owner_funds)
								);
						} else {
							console.log(
								`Remaining orders will be below the processed offer.`
							);
							break;
						}
					}
					console.log(
						`The offer will be placed below 
						${runningTotalAmount} ${tallyCurrency}`
					);
					const positiveRunningTotalAmount =
						runningTotalAmount > 0;
					const positiveBalance =
						runningTotalAmount < amountWanted;
					const remainingMoney =
						amountWanted - runningTotalAmount;
					if (
						positiveRunningTotalAmount &&
						positiveBalance
					) {
						console.log(
							`Remaining ${remainingMoney} ${tallyCurrency} 
							will be placed on top of the orderbook.`
						);
					}
				}
			}
		}
	}

	const offer = {
		TransactionType: "OfferCreate",
		Account: address,
		TakerGets: we_want,
		TakerPays: we_spend.value,
	}

	const preparedTransaction = await client.autofill(offer);
	const transaction = JSON.stringify(preparedTransaction, null, 2);
	console.log(`Prepared transaction: ${transaction}`);

	const signedTransaction = wallet.sign(preparedTransaction);
	console.log("Sending transaction...");
	const result = await client.submitAndWait(signedTransaction.tx_blob);
	if (result.result.meta.TransactionResult == "tesSUCCESS") {
		console.log(`Transaction succeeded ✅`);
		console.log(`Hash: ${signedTransaction.hash}`);
	} else {
		console.log(`Result: ${JSON.stringify(result, null, 2)}`);
		throw new Error("Transaction failed ❌");
	}

	const balance_changes = xrpl.getBalanceChanges(
		result.result.meta
	);
	console.log(
		"Total balance changes:",
		JSON.stringify(balance_changes, null, 2)
	);

	// Helper to convert an XRPL amount to a string for display
	function amt_str(amt) {
		if (typeof amt == "string") {
			return `${xrpl.dropsToXrp(amt)} XRP`;
		} else {
			return `${amt.value} ${amt.currency}.${amt.issuer}`;
		}
	}

	let offers_affected = 0;
	for (const affnode of result.result.meta.AffectedNodes) {
		if (affnode.hasOwnProperty("ModifiedNode")) {
			if (affnode.ModifiedNode.LedgerEntryType == "Offer") {
				// Usually a ModifiedNode of type Offer indicates a previous Offer that
				// was partially consumed by this one.
				offers_affected += 1;
			}
		} else if (affnode.hasOwnProperty("DeletedNode")) {
			if (affnode.DeletedNode.LedgerEntryType == "Offer") {
				// The removed Offer may have been fully consumed, or it may have been
				// found to be expired or unfunded.
				offers_affected += 1;
			}
		} else if (affnode.hasOwnProperty("CreatedNode")) {
			if (
				affnode.CreatedNode.LedgerEntryType == "RippleState"
			) {
				console.log("Created a trust line.");
			} else if (
				affnode.CreatedNode.LedgerEntryType == "Offer"
			) {
				const offer = affnode.CreatedNode.NewFields;
				console.log(`Created an Offer owned by ${
					offer.Account
				} with
          TakerGets=${amt_str(offer.TakerGets)} and
          TakerPays=${amt_str(offer.TakerPays)}.`);
			}
		}
	}
	console.log(
		`Modified or removed ${offers_affected} matching Offer(s)`
	);

	console.log("Getting address balances as of validated ledger...");
	const balances = await client.request({
		command: "account_lines",
		account: wallet.address,
		ledger_index: "validated",
		// You could also use ledger_index: "current" to get pending data
	});
	console.log(JSON.stringify(balances.result, null, 2));

	// Check Offers --------------------------------------------------------------
	console.log(
		`Getting outstanding Offers from ${wallet.address} as of validated ledger...`
	);
	const acct_offers = await client.request({
		command: "account_offers",
		account: wallet.address,
		ledger_index: "validated",
	});
	console.log(JSON.stringify(acct_offers.result, null, 2));

	console.log("Disconnecting from testnet...");
	client.disconnect();
}

main();
