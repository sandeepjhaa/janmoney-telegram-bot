// Money type selection
bot.action(/type_(legal|black)/, async (ctx) => {
  const type = ctx.match[1].toUpperCase();
  ctx.session.transferType = type;
  ctx.session.transferState = 'awaiting_reason';
  
  await ctx.editMessageText(
    `📝 Enter reason for transfer:\n` +
    `(This will be visible to RBI for approval)`
  );
});

// Initiate transfer function
async function initiateTransfer(ctx) {
  const { partyCode, transferRecipient, transferAmount, transferType, transferReason } = ctx.session;
  
  // Check balance
  if (transferType === 'LEGAL' && ctx.session.legalBalance < transferAmount) {
    await ctx.reply(`❌ INSUFFICIENT LEGAL MONEY!\n\nAvailable: ₹${ctx.session.legalBalance} Cr\nRequired: ₹${transferAmount} Cr`);
    resetTransferSession(ctx);
    return;
  }
  
  if (transferType === 'BLACK' && ctx.session.blackBalance < transferAmount) {
    await ctx.reply(`❌ INSUFFICIENT BLACK MONEY!\n\nAvailable: ₹${ctx.session.blackBalance} Cr\nRequired: ₹${transferAmount} Cr`);
    resetTransferSession(ctx);
    return;
  }
  
  try {
    // Create transaction in Google Sheets
    const txnResponse = await axios.post(GAS_URL, {
      action: 'postTransaction',
      fromParty: partyCode,
      toParty: transferRecipient,
      amount: transferAmount,
      type: transferType,
      reason: transferReason,
      status: 'PENDING_RBI'
    });
    
    const txnId = txnResponse.data.txnId;
    
    // Send to RBI Approval Room
    await sendToRBIApproval(ctx, txnId);
    
    await ctx.reply(
      `🔄 *TRANSFER INITIATED* ⏳\n\n` +
      `To: *${transferRecipient}*\n` +
      `Amount: *₹${transferAmount} Crore* ${transferType === 'LEGAL' ? '💵' : '⚫'}\n` +
      `Reason: ${transferReason}\n\n` +
      `⏰ Awaiting RBI approval (30 seconds)...`,
      { parse_mode: 'Markdown' }
    );
    
    resetTransferSession(ctx);
    
  } catch (error) {
    await ctx.reply('🔧 Transfer initiation failed. Contact RBI volunteers.');
  }
}