async function lookUpOffers(client, address, we_want, we_spend) {
	const quality = new Big(we_spend.value) / new Big(we_want.value);

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
			if (runningTotalAmount > 0 && runningTotalAmount < amountWanted) {
				const remainingMoney = amountWanted - runningTotalAmount;
				console.log(
					`Remaining ${remainingMoney} ${currency} 
					will be placed at the top of the orderbook.`
				);
			}

			if (runningTotalAmount == 0) {
				const quality =
					new Big(we_want.value) / new Big(we_spend.value);

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
				if (tallyCurrency == "XRP") tallyCurrency = "drops of XRP";

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
							runningTotalAmount =runningTotalAmount.plus(
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
					const positiveRunningTotalAmount = runningTotalAmount > 0;
					const positiveBalance = runningTotalAmount < amountWanted;
					const remainingMoney = amountWanted - runningTotalAmount;
					if (positiveRunningTotalAmount && positiveBalance) {
						console.log(
							`Remaining ${remainingMoney} ${tallyCurrency} 
							will be placed on top of the orderbook.`
						);
					}
				}
			}
		}
	}
}

module.exports = {
    lookUpOffers,
}
