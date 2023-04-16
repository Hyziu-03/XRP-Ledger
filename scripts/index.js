const xrpl = require("xrpl");
const server = require("../tools/server.js");
const { setupWallet } = require("../tools/helpers.js");

async function main() {
	const client = new xrpl.Client(server);
	console.log("Connecting to testnet...");
	await client.connect();

	const wallet = (await setupWallet(client)).wallet;
	console.log("Requesting account information...");
	const response = await client.request({
		command: "account_info",
		account: wallet.address,
		ledger_index: "validated",
	});

	console.log("Subscribing to the ledger...");
	client.request({
		command: "subscribe",
		streams: ["ledger"],
	});

	console.log("Validating ledger...");
	client.on("ledgerClosed", async function (ledger) {
		const index = ledger.ledger_index;
		const transactionCount = ledger.txn_count;

		console.log(
			`Ledger #${index} validated with ${transactionCount} transactions ✅`
		);
	});

	console.log("Disconnecting from testnet...");
	client.disconnect();
}

main();
