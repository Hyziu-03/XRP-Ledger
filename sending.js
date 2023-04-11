const xrpl = require("xrpl");

const seed = "shRvy2jLMHYNNwLjBHF85RnMAGSuB";
const destinationAddress = "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59";

async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  console.log("Connecting to testnet...");
  await client.connect();

  console.log("Setting up wallet from seed...")
  const wallet = xrpl.Wallet.fromSeed(seed);
  const { publicKey, privateKey, address } = wallet;

  console.log("Public Key: ", publicKey);
  console.log("Private Key: ", privateKey);
  console.log("Classic Address: ", address);

  const xrp = xrpl.xrpToDrops("10");
  console.log("Prepating transaction details...");
  const details = await client.autofill({
    TransactionType: "Payment",
    Account: address,
    Amount: xrp,
    Destination: destinationAddress,
  });

  const { Account, Amount, Destination, TransactionType } = details;
  console.log("Account: ", Account);
  console.log(`Amount: ${xrpl.dropsToXrp(Amount)} XRP`);
  console.log("Destination: ", Destination);
  console.log("Transaction type: ", TransactionType);

  const ledger = details.LastLedgerSequence;
  console.log(`Cost: ${xrpl.dropsToXrp(details.Fee)} XRP`);
  console.log("Expires after last ledger sequence: ", ledger);

  console.log("Signing transaction...");
  const signed = wallet.sign(details);
  console.log("Hash: ", signed.hash);
  console.log("Blob: ", signed.tx_blob);

  console.log("Submitting transaction...");
  const transaction = await client.submitAndWait(signed.tx_blob);

  const result = transaction.result.meta.TransactionResult;
  if (result === "tesSUCCESS") console.log("Transaction successful ✅");

  console.log("Disconnecting from testnet...");
  client.disconnect();
}

main();
