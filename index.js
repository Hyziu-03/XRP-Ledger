const xrpl = require("xrpl");

async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  const funding = await client.fundWallet();
  const { wallet, balance } = funding;
  const { publicKey, privateKey, classicAddress, seed } = wallet;

  console.log(`Balance: ${balance} XRP`);
  console.log("Public Key: ", publicKey);
  console.log("Private Key: ", privateKey);
  console.log("Classic Adress: ", classicAddress);
  console.log("Seed: ", seed);

  const response = await client.request({
    command: "account_info",
    account: wallet.address,
    ledger_index: "validated",
  });

  client.request({
    command: "subscribe",
    streams: ["ledger"],
  });

  client.on("ledgerClosed", async function (ledger) {
    const index = ledger.ledger_index;
    const transactionCount = ledger.txn_count;

    console.log(
      `Ledger #${index} validated with ${transactionCount} transactions`
    );
  });

  client.disconnect();
}

main();
