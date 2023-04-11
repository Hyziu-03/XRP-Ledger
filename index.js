const xrpl = require("xrpl");

async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  console.log("Connecting to testnet...");
  await client.connect();

  const funding = await client.fundWallet();
  console.log("Funding wallet...");
  const { wallet, balance } = funding;
  const { publicKey, privateKey, classicAddress, seed } = wallet;

  console.log(`Balance: ${balance} XRP`);
  console.log("Public Key: ", publicKey);
  console.log("Private Key: ", privateKey);
  console.log("Classic Adress: ", classicAddress);
  console.log("Seed: ", seed);

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
