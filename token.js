const xrpl = require("xrpl");

const credentials = {
  hotWallet: {
    address: "rGf1V8SK2PcVcDpCzvhbWRMebzJfCJdYxG",
    secret: "snidrSmXUgC4vQ2PmPPdW37U7V3nW",
  },
  coldWallet: {
    address: "r9GERJj9xucoqEs69X6spWDdNsPwpfqvua",
    secret: "shZWMLkQbkswWKGeVzCj39uZ7tRAa",
  },
};

async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  console.log("Connecting to testnet...");
  await client.connect();

  console.log("Funding wallets...");
  const hotWallet = (await client.fundWallet()).wallet;
  const coldWallet = (await client.fundWallet()).wallet;

  const coldWalletSettings = {
    TransactionType: "AccountSet",
    Account: coldWallet.address,
    TransferRate: 0,
    TickSize: 5,
    Domain: "6578616D706C652E636F6D",
    SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
    Flags:
      xrpl.AccountSetTfFlags.tfDisallowXRP |
      xrpl.AccountSetTfFlags.tfRequireDestTag,
  };

  console.log("Preparing transaction from cold wallet...");
  const preparedColdWalletSettings = await client.autofill(coldWalletSettings);
  const signedColdWalletSettings = coldWallet.sign(preparedColdWalletSettings);
  console.log("Sending transaction from cold wallet...");

  const result = await client.submitAndWait(signedColdWalletSettings.tx_blob);
  const hash = signedColdWalletSettings.hash;

  if ((result.result.meta.TransactionResult = "tesSUCCESS")) {
    console.log(`Transaction from cold wallet succeeded ✅`);
    console.log(`Hash: ${hash}`);
  } else {
    console.log(`Result: ${result}`);
    throw new Error("Cold wallet transaction failed ❌");
  }

  const hotWalletSettings = {
    TransactionType: "AccountSet",
    Account: hotWallet.address,
    Domain: "6578616D706C652E636F6D",
    SetFlag: xrpl.AccountSetAsfFlags.asfRequireAuth,
    Flags:
      xrpl.AccountSetTfFlags.tfDisallowXRP |
      xrpl.AccountSetTfFlags.tfRequireDestTag,
  };

  console.log("Preparing transaction from hot wallet...");
  const preparedHotWalletSettings = await client.autofill(hotWalletSettings);
  const signedHotWalletSettings = hotWallet.sign(preparedHotWalletSettings);
  console.log("Sending transaction from hot wallet...");

  const result2 = await client.submitAndWait(signedHotWalletSettings.tx_blob);
  const hash2 = signedHotWalletSettings.hash;

  if ((result2.result.meta.TransactionResult = "tesSUCCESS")) {
    console.log(`Transaction from hot wallet succeeded ✅`);
    console.log(`Hash: ${hash2}`);
  } else {
    console.log(`Result: ${result2}`);
    throw new Error("Hot wallet transaction failed ❌");
  }

  const currencyCode = "FOO";
  const trustLineSettings = {
    TransactionType: "TrustSet",
    Account: hotWallet.address,
    LimitAmount: {
      currency: currencyCode,
      issuer: coldWallet.address,
      value: "1000000000",
    },
  };

  console.log("Preparing trust line...");
  const preparedTrustLineSettings = await client.autofill(trustLineSettings);
  const signedTrustLineSettings = hotWallet.sign(preparedTrustLineSettings);
  console.log("Setting up trust line...");

  const result3 = await client.submitAndWait(signedTrustLineSettings.tx_blob);
  const hash3 = signedTrustLineSettings.hash;

  if ((result3.result.meta.TransactionResult = "tesSUCCESS")) {
    console.log(`Transaction succeeded ✅`);
    console.log(`Hash: ${hash3}`);
  } else {
    console.log(`Result: ${result3}`);
    throw new Error("Transaction failed ❌");
  }

  const quantity = "3840";
  const sendingSettings = {
    TransactionType: "Payment",
    Account: coldWallet.address,
    Amount: {
      currency: currencyCode,
      value: quantity,
      issuer: coldWallet.address,
    },
    Destination: hotWallet.address,
    DestinationTag: 1,
  };

  console.log("Preparing transaction...");
  const preparedSendingSettings = await client.autofill(sendingSettings);
  const signedSendingSettings = coldWallet.sign(preparedSendingSettings);
  console.log(`Sending ${quantity} ${currencyCode}...`);

  const result4 = await client.submitAndWait(signedSendingSettings.tx_blob);
  const hash4 = signedSendingSettings.hash;

  if ((result4.result.meta.TransactionResult = "tesSUCCESS")) {
    console.log(`Transaction succeeded ✅`);
    console.log(`Hash: ${hash4}`);
  } else {
    console.log(`Result: ${result4}`);
    throw new Error("Transaction failed ❌");
  }

  console.log("Getting hot wallet information...");
  const hotWalletBalance = await client.request({
    command: "account_lines",
    account: hotWallet.address,
    ledger_index: "validated",
  });
  console.log(hotWalletBalance.result);

  console.log("Getting cold wallet information...");
  const coldWalletBalance = await client.request({
    command: "gateway_balances",
    account: coldWallet.address,
    ledger_index: "validated",
    hotwallet: [hotWallet.address],
  });
  console.log(JSON.stringify(coldWalletBalance.result, null, 2));

  console.log("Disconnecting from testnet...");
  client.disconnect();
}

main();