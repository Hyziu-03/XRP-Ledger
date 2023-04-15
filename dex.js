const xrpl = require("xrpl");
const server = require("./server.js");
const Big = require("big.js");
const { lookUpOffers } = require("./dex.js");
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

	const balanceChanges = xrpl.getBalanceChanges(result.result.meta);
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
			const deletedNode = affectedNode.DeletedNode.LedgerEntryType == "Offer";
			if (modifiedNode || deletedNode) offersAffected += 1;
		} else if (affectedNode.hasOwnProperty("CreatedNode")) {
			if (affectedNode.CreatedNode.LedgerEntryType == "RippleState") {
				console.log("Trust line created.");
			} else if (affectedNode.CreatedNode.LedgerEntryType == "Offer") {
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
}

main();
