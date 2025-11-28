bot.command('login', async (ctx) => {
  await ctx.reply('🔐 Enter your 5-digit party code:');
  ctx.session.waitingForLogin = true;
});

// Handle party code input
bot.on('text', async (ctx) => {
  if (ctx.session.waitingForLogin) {
    const partyCode = ctx.message.text.toUpperCase();
    
    try {
      const response = await axios.post(GAS_URL, {
        action: 'login',
        partyCode: partyCode,
        telegramId: ctx.from.id
      });
      
      const partyData = response.data;
      
      if (partyData.error) {
        await ctx.reply(`❌ ${partyData.error}\n\nPlease try again with correct party code.`);
        return;
      }
      
      // Successful login
      ctx.session.partyCode = partyCode;
      ctx.session.partyName = partyData.PartyName;
      ctx.session.legalBalance = partyData.LegalBalance;
      ctx.session.blackBalance = partyData.BlackBalance;
      ctx.session.waitingForLogin = false;
      
      await ctx.reply(
        `🎉 *LOGIN SUCCESSFUL!* 🏦\n\n` +
        `Party: *${partyData.PartyName}*\n` +
        `💰 *Current Balance:*\n` +
        `💵 Legal Money: ₹${partyData.LegalBalance} Crore\n` +
        `⚫ Black Money: ₹${partyData.BlackBalance} Crore\n\n` +
        `Choose an option from the menu below:`,
        { 
          parse_mode: 'Markdown',
          ...MainMenuKeyboard 
        }
      );
      
    } catch (error) {
      await ctx.reply('🔧 System error. Please contact RBI volunteers.');
    }
  }
});