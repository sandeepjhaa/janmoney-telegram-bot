bot.hears('📰 Pay Press', requireLogin, async (ctx) => {
  ctx.session.transferState = 'awaiting_press_amount';
  await ctx.reply(
    `📰 *PAY PRESS CORPS* 🎥\n\n` +
    `Enter amount in Crores for press services:\n` +
    `(This will be auto-approved for immediate media coverage)`,
    { parse_mode: 'Markdown' }
  );
});

// Handle press payment amount
bot.on('text', async (ctx) => {
  if (ctx.session.transferState === 'awaiting_press_amount') {
    const amount = parseInt(ctx.message.text);
    
    if (isNaN(amount) || amount < 1) {
      await ctx.reply('❌ Invalid amount. Minimum 1 Crore');
      return;
    }
    
    // Auto-create press transaction
    try {
      const txnResponse = await axios.post(GAS_URL, {
        action: 'postTransaction',
        fromParty: ctx.session.partyCode,
        toParty: 'PRESS01',
        amount: amount,
        type: 'LEGAL',
        reason: 'Press services payment',
        status: 'APPROVED',
        approvedBy: 'AUTO_PRESS'
      });
      
      await ctx.reply(
        `✅ *PRESS PAYMENT COMPLETED!* 📰\n\n` +
        `Amount: *₹${amount} Crore*\n` +
        `Recipient: Press Corps\n\n` +
        `*Media coverage secured!* 🎥`,
        { parse_mode: 'Markdown' }
      );
      
      resetTransferSession(ctx);
      
    } catch (error) {
      await ctx.reply('❌ Press payment failed');
    }
  }
});