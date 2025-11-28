// In the updateTransactionStatus function, add black money check
async function updateTransactionStatus(txnId, status, approvedBy, rejectionReason) {
  // ... existing code ...
  
  // Black money alert for amounts >= 5 Crore
  if (status === 'APPROVED' && txn.Type === 'BLACK' && txn.Amount >= 5) {
    await sendECIAlert(txn);
  }
}

async function sendECIAlert(transaction) {
  await bot.telegram.sendMessage(
    process.env.ECI_GROUP_ID,
    `🚨 *HIGH-VALUE BLACK MONEY MOVEMENT DETECTED* 🚨\n\n` +
    `*From:* ${transaction.FromParty}\n` +
    `*To:* ${transaction.ToParty}\n` +
    `*Amount:* ₹${transaction.Amount} Crore ⚫\n` +
    `*Reason:* ${transaction.Reason}\n` +
    `*Time:* ${new Date().toLocaleString()}\n\n` +
    `*Possible raid target! Investigate!* 🔍`,
    { parse_mode: 'Markdown' }
  );
}