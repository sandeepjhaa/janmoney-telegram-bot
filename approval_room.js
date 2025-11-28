async function sendToRBIApproval(ctx, txnId) {
  const { partyCode, partyName, transferRecipient, transferAmount, transferType, transferReason } = ctx.session;
  
  const message = await bot.telegram.sendMessage(
    process.env.RBI_GROUP_ID,
    `🔄 *TRANSFER REQUEST AWAITING APPROVAL* ⚖️\n\n` +
    `*From:* ${partyCode} (${partyName})\n` +
    `*To:* ${transferRecipient}\n` +
    `*Amount:* ₹${transferAmount} Crore ${transferType === 'LEGAL' ? '💵 Legal' : '⚫ Black'}\n` +
    `*Reason:* ${transferReason}\n` +
    `*Txn ID:* ${txnId}\n\n` +
    `⏰ *Approve within 30 seconds:*`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ APPROVE', callback_data: `approve_${txnId}` },
            { text: '❌ REJECT', callback_data: `reject_${txnId}` }
          ]
        ]
      }
    }
  );
  
  // Auto-reject after 30 seconds
  setTimeout(async () => {
    try {
      const statusResponse = await axios.post(GAS_URL, {
        action: 'getTransactionStatus',
        txnId: txnId
      });
      
      if (statusResponse.data.status === 'PENDING_RBI') {
        await updateTransactionStatus(txnId, 'REJECTED', 'AUTO_RBI', 'Approval timeout (30s)');
        await notifyTransferRejection(ctx, txnId, 'Approval timeout - no RBI response within 30 seconds');
      }
    } catch (error) {
      console.error('Auto-reject error:', error);
    }
  }, 30000);
}

// Handle RBI approval/rejection
bot.action(/approve_(.+)/, async (ctx) => {
  const txnId = ctx.match[1];
  const rbiVolunteer = ctx.from.first_name;
  
  try {
    await updateTransactionStatus(txnId, 'APPROVED', rbiVolunteer, '');
    await ctx.editMessageText(
      ctx.update.callback_query.message.text + `\n\n✅ *APPROVED BY ${rbiVolunteer}*`,
      { parse_mode: 'Markdown' }
    );
    
    // Notify parties
    await notifyTransferApproval(txnId);
    
  } catch (error) {
    await ctx.answerCbQuery('❌ Approval failed');
  }
});

bot.action(/reject_(.+)/, async (ctx) => {
  const txnId = ctx.match[1];
  
  // Ask for rejection reason
  ctx.session.rejectingTxnId = txnId;
  ctx.session.rejectingRBI = ctx.from.first_name;
  
  await ctx.deleteMessage();
  await ctx.reply(
    `❌ REJECTION REQUEST\n\n` +
    `Transaction: ${txnId}\n\n` +
    `Please enter rejection reason:`
  );
});