async function updateTransactionStatus(txnId, status, approvedBy, rejectionReason) {
  await axios.post(GAS_URL, {
    action: 'updateStatus',
    txnId: txnId,
    status: status,
    approvedBy: approvedBy,
    rejectionReason: rejectionReason
  });
}

async function notifyTransferApproval(txnId) {
  // Get transaction details
  const txnResponse = await axios.post(GAS_URL, {
    action: 'getTransaction',
    txnId: txnId
  });
  
  const txn = txnResponse.data;
  
  // Notify sender
  await bot.telegram.sendMessage(
    getTelegramIdByPartyCode(txn.FromParty),
    `✅ *TRANSFER APPROVED!* 🇮🇳\n\n` +
    `💰 *₹${txn.Amount} Crore* ${txn.Type} money transferred to *${txn.ToParty}*\n` +
    `📝 Reason: ${txn.Reason}\n\n` +
    `*Coalition funded!* 🎯`,
    { parse_mode: 'Markdown' }
  );
  
  // Notify receiver (if they have Telegram ID)
  const receiverId = getTelegramIdByPartyCode(txn.ToParty);
  if (receiverId) {
    await bot.telegram.sendMessage(
      receiverId,
      `💰 *INCOMING TRANSFER!* 🇮🇳\n\n` +
      `You received *₹${txn.Amount} Crore* ${txn.Type} money from *${txn.FromParty}*\n` +
      `Reason: ${txn.Reason}\n\n` +
      `*New balance updated!*`,
      { parse_mode: 'Markdown' }
    );
  }
}