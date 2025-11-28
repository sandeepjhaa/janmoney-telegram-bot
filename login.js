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
//added code at 04:07 at 29-11-25
      catch (error) {
    // CRITICAL DEBUGGING LINE:
    console.error('AXIOS API CALL FAILED. Details:', error.message);
    
    // Check if the error is a network error or a bad HTTP response
    if (error.response) {
        console.error('GAS Status Code:', error.response.status);
        // This is the response from the GAS server itself (e.g., 500)
        console.error('GAS Error Data:', error.response.data); 
    } else {
        // This is a network error (like a DNS issue or timeout)
        console.error('Network/Timeout Error:', error.code);
    }
    
    // ... handle failure ...
    return { error: true, message: 'Internal Server Error during validation.' };
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
