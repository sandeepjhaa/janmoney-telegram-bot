bot.hears('💰 Check Balance', requireLogin, async (ctx) => {
  try {
    const response = await axios.post(GAS_URL, {
      action: 'getParty',
      partyCode: ctx.session.partyCode
    });
    
    const party = response.data;
    
    await ctx.reply(
      `💰 *CURRENT BALANCE* 🏦\n\n` +
      `Party: *${party.PartyName}*\n\n` +
      `💵 *Legal Money:* ₹${party.LegalBalance} Crore\n` +
      `⚫ *Black Money:* ₹${party.BlackBalance} Crore\n\n` +
      `*Total:* ₹${parseInt(party.LegalBalance) + parseInt(party.BlackBalance)} Crore`,
      { parse_mode: 'Markdown' }
    );
    
  } catch (error) {
    await ctx.reply('🔧 Unable to fetch balance. Contact RBI volunteers.');
  }
});