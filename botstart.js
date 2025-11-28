// Start the bot
bot.launch().then(() => {
  console.log('🏦 National Bank of Bharat bot is running!');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));