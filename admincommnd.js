// Admin authentication middleware
function requireAdmin(ctx, next) {
  const adminIds = process.env.ADMIN_IDS.split(',').map(id => parseInt(id));
  if (!adminIds.includes(ctx.from.id)) {
    ctx.reply('❌ Admin access required');
    return;
  }
  return next();
}

// Seize command
bot.command('seize', requireAdmin, async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length < 4) {
    await ctx.reply('Usage: /seize PARTYCODE AMOUNT TYPE "Reason"');
    return;
  }
  
  const [partyCode, amountStr, type, ...reasonParts] = args;
  const amount = parseInt(amountStr);
  const reason = reasonParts.join(' ');
  
  try {
    await axios.post(GAS_URL, {
      action: 'adminAction',
      command: 'seize',
      partyCode: partyCode,
      amount: amount,
      type: type.toUpperCase(),
      reason: reason,
      admin: ctx.from.first_name
    });
    
    // Broadcast seizure announcement
    await broadcastMessage(
      `⚡️ *RBI SEIZURE ALERT!* ⚡️\n\n` +
      `The National Bank of Bharat has seized *₹${amount} Crore ${type} money* from *${partyCode}*!\n\n` +
      `Reason: ${reason}\n\n` +
      `*Maintain financial discipline or face consequences!* 🇮🇳`,
      ctx.session.partyCode // Exclude the seized party
    );
    
    await ctx.reply('✅ Seizure executed successfully');
    
  } catch (error) {
    await ctx.reply('❌ Seizure failed');
  }
});

// Broadcast command
bot.command('broadcast', requireAdmin, async (ctx) => {
  const message = ctx.message.text.split(' ').slice(1).join(' ');
  
  if (!message) {
    await ctx.reply('Usage: /broadcast Your message here');
    return;
  }
  
  await broadcastMessage(`📢 *BANK ANNOUNCEMENT:*\n\n${message}`);
  await ctx.reply('✅ Broadcast sent to all parties');
});

// Leaderboard command
bot.command('leaderboard', requireAdmin, async (ctx) => {
  const leaderboard = await getLeaderboard();
  await ctx.reply(leaderboard, { parse_mode: 'Markdown' });
});

async function broadcastMessage(message, excludeParty = null) {
  // Get all logged-in parties from Google Sheets
  const parties = await getLoggedInParties();
  
  for (const party of parties) {
    if (party.PartyCode !== excludeParty && party.TelegramID) {
      try {
        await bot.telegram.sendMessage(party.TelegramID, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error(`Failed to send to ${party.PartyCode}:`, error);
      }
    }
  }
}