bot.command('login', async (ctx) => {
  await ctx.reply('🔐 Enter your 5-digit party code:');
  ctx.session.waitingForLogin = true;
});

// Handle party code input
bot.on('text', async (ctx) => {
  // Only process if waiting for login
  if (ctx.session.waitingForLogin) {
    const partyCode = ctx.message.text.trim().toUpperCase();
    
    // 1. Basic validation
    if (!partyCode.match(/^[A-Z0-9]{5}$/)) {
        return ctx.reply("⚠️ Invalid format. Please enter the 5-digit code (e.g., BJP01).");
    }

    await ctx.reply(`Code received: ${partyCode}. Running database check...`);

    try {
      // 2. Call Google Apps Script
      // Ensure GAS_URL is loaded correctly from .env
      const response = await axios.post(process.env.GAS_WEBAPP_URL, {
        action: 'login',
        partyCode: partyCode,
        telegramId: ctx.from.id
      });
      
      const partyData = response.data;
      
      // 3. Handle Script Errors (e.g., Invalid Code)
      if (partyData.error) {
        await ctx.reply(`❌ ${partyData.error}\n\nPlease try again.`);
        return; // Stop execution here
      }
      
      // 4. Successful Login
      ctx.session.partyCode = partyCode;
      ctx.session.partyName = partyData.PartyName;
      ctx.session.legalBalance = partyData.LegalBalance;
      ctx.session.blackBalance = partyData.BlackBalance;
      ctx.session.waitingForLogin = false; // Turn off the waiting flag
      
      await ctx.reply(
        `🎉 *LOGIN SUCCESSFUL!* 🏦\n\n` +
        `Party: *${partyData.PartyName}*\n` +
        `💰 *Current Balance:*\n` +
        `💵 Legal Money: ₹${partyData.LegalBalance} Crore\n` +
        `⚫ Black Money: ₹${partyData.BlackBalance} Crore\n\n` +
        `Choose an option from the menu below:`,
        { parse_mode: 'Markdown' }
      );
      
    } catch (error) {
      // 5. Network/System Error Handling
      console.error('AXIOS API CALL FAILED:', error.message);
      
      if (error.response) {
         console.error('GAS Status Code:', error.response.status);
         console.error('GAS Data:', error.response.data);
      }

      await ctx.reply('🔧 System error: Unable to connect to the Bank Server. Please contact Admin.');
    }
  }
});
