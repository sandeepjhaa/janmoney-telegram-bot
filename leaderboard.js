bot.hears('🏆 Leaderboard', requireLogin, async (ctx) => {
  try {
    const leaderboard = await getLeaderboard();
    await ctx.reply(leaderboard, { parse_mode: 'Markdown' });
  } catch (error) {
    await ctx.reply('🔧 Unable to fetch leaderboard.');
  }
});

async function getLeaderboard() {
  const response = await axios.get(`${GAS_URL}?action=leaderboard`);
  const topParties = response.data;
  
  let leaderboardText = `🏆 *TOP 5 RICHEST PARTIES* 👑\n\n`;
  
  topParties.forEach((party, index) => {
    const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
    leaderboardText += `${medal} *${party.PartyName}*\n` +
                      `   💰 ₹${party.TotalBalance} Crore\n` +
                      `   (💵 ${party.LegalBalance} ⚫ ${party.BlackBalance})\n\n`;
  });
  
  leaderboardText += `*Last updated:* ${new Date().toLocaleTimeString()}`;
  return leaderboardText;
}