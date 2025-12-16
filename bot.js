const { Telegraf, Markup, session } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const axios = require('axios');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const GAS_URL = process.env.GAS_WEBAPP_URL;

// Define a function that returns the unique User ID regardless of chat type
const getSessionKey = (ctx) => {
    if (ctx.from && ctx.chat) {
        // Return a key based only on the user's ID
        return String(ctx.from.id);
    }
    return null; // Don't process updates without a user
};

// Session middleware
bot.use(
    new LocalSession({ 
        database: 'sessions.json',
        getSessionKey: getSessionKey // <--- THIS IS THE KEY FIX
    }).middleware()
);

// Start command
bot.start(async (ctx) => {
  await ctx.reply(
    `🏦 *National Bank of Bharat* 🇮🇳\n\n` +
    `Welcome to Project Pradhanmantri Banking System!\n\n` +
    `Please login with your 5-digit party code from the Confidential File:\n` +
    `Example: \`BJP01\``,
    { parse_mode: 'Markdown' }
  );
});

