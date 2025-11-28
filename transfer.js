bot.hears('🔄 Transfer Money', requireLogin, async (ctx) => {
  ctx.session.transferState = 'awaiting_recipient';
  await ctx.reply(
    '👥 Enter recipient party code:\n' +
    'Example: `CON02`',
    { parse_mode: 'Markdown' }
  );
});

// Transfer conversation flow
bot.on('text', async (ctx) => {
  if (ctx.session.transferState === 'awaiting_recipient') {
    const recipient = ctx.message.text.toUpperCase();
    
    // Validate recipient format
    if (!/^[A-Z]{3}\d{2}$/.test(recipient)) {
      await ctx.reply('❌ Invalid party code format. Use format like BJP01, CON02');
      return;
    }
    
    ctx.session.transferRecipient = recipient;
    ctx.session.transferState = 'awaiting_amount';
    await ctx.reply('💰 Enter amount in Crores:');
    
  } else if (ctx.session.transferState === 'awaiting_amount') {
    const amount = parseInt(ctx.message.text);
    
    if (isNaN(amount) || amount < 1) {
      await ctx.reply('❌ Invalid amount. Please enter a number (minimum 1 Crore)');
      return;
    }
    
    ctx.session.transferAmount = amount;
    ctx.session.transferState = 'awaiting_type';
    
    await ctx.reply(
      '💸 Select money type:',
      Markup.inlineKeyboard([
        [Markup.button.callback('💵 Legal Money', 'type_legal')],
        [Markup.button.callback('⚫ Black Money', 'type_black')]
      ])
    );
    
  } else if (ctx.session.transferState === 'awaiting_reason') {
    const reason = ctx.message.text;
    ctx.session.transferReason = reason;
    
    // Complete transfer initiation
    await initiateTransfer(ctx);
  }
});