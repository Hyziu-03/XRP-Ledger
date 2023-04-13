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
    console.log(JSON.stringify(orderbookResponse.result, null, 2));

    const offers = orderbookResponse.result.offers;
    const amountWanted = new Big(we_want.value);
    let runningTotalAmount = new Big(0);

    // ...

	console.log("Disconnecting from testnet...");
	client.disconnect();
}

main();
