const MainMenuKeyboard = Markup.keyboard([
  ['💰 Check Balance', '🔄 Transfer Money'],
  ['📰 Pay Press', '🏦 Request Printing'],
  ['📊 Transaction History', '🏆 Leaderboard']
]).resize();

// Helper function to check if user is logged in
function requireLogin(ctx, next) {
  if (!ctx.session.partyCode) {
    ctx.reply('🔐 Please login first using /login command');
    return;
  }
  return next();
}