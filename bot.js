const { Telegraf, Markup, session } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const GAS_URL = process.env.GAS_WEBAPP_URL;

// Session middleware
bot.use(session());

// Start command
bot.start(async (ctx) => {
  await ctx.reply(
    `🏦 *National Bank of Bharat* 🇮🇳\n\n` +
    `Welcome to Project Pradhanmantri Banking System!\n\n` +
    `Please login with your 5-digit party code from the Confidential File:\n` +
    `Example: \\`BJP01\\``,
    { parse_mode: 'Markdown' }
  );
});