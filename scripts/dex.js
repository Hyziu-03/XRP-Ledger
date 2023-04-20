// Needs to be refactored with exchange.js

const xrpl = require("xrpl");
const server = require("../tools/server.js");
const { lookUpOffers } = require("../tools/steps.js");
const { setupWallet } = require("../tools/helpers.js");
const Big = require("big.js");
require("dotenv").config();

async function lookUpOffers(client, address, we_want, we_spend) {
	try {
		const quality =
			new Big(we_spend.value) / new Big(we_want.value);

		const orderbookResponse = await client.request({
			command: "book_offers",
			taker: address,
			ledger_index: "current",
			taker_gets: we_want,
			taker_pays: we_spend,
		});
		console.log("Waiting for orderbook response...");

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
						new Big(we_want.value) /
						new Big(we_spend.value);

					const orderbookResponse = await client.request({
						command: "book_offers",
						taker: address,
						ledger_index: "current",
						taker_gets: we_spend,
						taker_pays: we_want,
					});
					console.log("Waiting for orderbook response...");

					const offers = orderbookResponse.result.offers;

					let tallyCurrency = we_spend.currency;
					if (tallyCurrency == "XRP")
						tallyCurrency = "drops of XRP";

					let runningTotalAmount = 0;
					if (!offers) {
						console.log(
							`No simmilar offers found in the orderbook.`
						);
					} else {
						for (const offer of offers) {
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
	} catch (error) {
		console.error("There was an error looking up offers ❌");
		throw new Error(error);
	}
}

async function main() {
	try {
		const client = new xrpl.Client(server);
		console.log("Connecting to testnet...");
		await client.connect();

		const wallet = (await setupWallet(client)).wallet;
		const address = wallet.address;

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

		lookUpOffers(client, address, we_want, we_spend);

		const offer = {
			TransactionType: "OfferCreate",
			Account: address,
			TakerGets: we_want,
			TakerPays: we_spend.value,
		};

		const preparedTransaction = await client.autofill(offer);

		const signedTransaction = wallet.sign(preparedTransaction);
		console.log("Sending transaction...");
		const result = await client.submitAndWait(
			signedTransaction.tx_blob
		);
		if (result.result.meta.TransactionResult == "tesSUCCESS") {
			console.log(`Transaction succeeded ✅`);
			console.log(`Hash: ${signedTransaction.hash}`);
		} else {
			console.error("Transaction failed ❌");
		}

		const balanceChanges = xrpl.getBalanceChanges(
			result.result.meta
		);
		function amountAsString(amount) {
			if (typeof amount == "string") {
				return `${xrpl.dropsToXrp(amount)} XRP`;
			} else {
				const value = amount.value;
				const currency = amount.currency;
				const issuer = amount.issuer;
				return `${value} ${currency}.${issuer}`;
			}
		}

		let offersAffected = 0;
		for (const affectedNode of result.result.meta.AffectedNodes) {
			if (affectedNode.hasOwnProperty("ModifiedNode")) {
				const modifiedNode = affectedNode.ModifiedNode.LedgerEntryType == "Offer";
				if (modifiedNode) offersAffected += 1;
			} else if (affectedNode.hasOwnProperty("DeletedNode")) {
				const deletedNode = affectedNode.DeletedNode.LedgerEntryType == "Offer";
				if (deletedNode) offersAffected += 1;
			} else if (affectedNode.hasOwnProperty("CreatedNode")) {
				if (
					affectedNode.CreatedNode.LedgerEntryType ==
					"RippleState"
				) {
					console.log("Trust line created.");
				} else if (
					affectedNode.CreatedNode.LedgerEntryType ==
					"Offer"
				) {
					const offer = affectedNode.CreatedNode.NewFields;
					const owner = offer.Account;
					const takerGets = offer.TakerGets;
					const takerPays = offer.TakerPays;
					console.log(
						`Created an Offer owned by ${owner} with parameters.`
					);
					console.log(
						`TakerGets = ${amountAsString(takerGets)}`
					);
					console.log(
						`TakerPays = ${amountAsString(takerPays)}`
					);
				}
			}
		}
		console.log(
			`Modified or removed ${offersAffected} matching offer(s)`
		);

		console.log("Getting balance as of validated ledger...");
		const balances = await client.request({
			command: "account_lines",
			account: wallet.address,
			ledger_index: "validated",
		});

		console.log(
			`Getting offers from ${address} as of validated ledger...`
		);
		const accountOffers = await client.request({
			command: "account_offers",
			account: address,
			ledger_index: "validated",
		});

		console.log("Disconnecting from testnet...");
		client.disconnect();
	} catch (error) {
		console.error(
			"There was an error transacting on the decentralized exchange ❌"
		);
		throw new Error(error);
	}
}

main();
