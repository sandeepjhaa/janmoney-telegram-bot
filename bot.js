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
    `Example: \`BJP01\``,
    { parse_mode: 'Markdown' }
  );
});

// --- NEW HANDLER: Captures the 5-digit Party Code ---
bot.on('text', async (ctx) => {
    const userInput = ctx.message.text.trim().toUpperCase();
    
    // Check if the user is already logged in or if the input looks like a Party Code
    if (ctx.session.isLoggedIn) {
        // User is logged in, send them back to the menu or handle a command
        return ctx.reply("You are already logged in. Please use the menu buttons or /menu.");
    }

    if (userInput.match(/^[A-Z0-9]{5}$/)) { // Regex to check for 5 characters, alphanumeric
        // This confirms the bot has received the input and is now processing the code.
        await ctx.reply(`*Code received:* \`${userInput}\`. Running database check...`, { parse_mode: 'Markdown' });
        
        // Save the code to session to be used by the login function
        ctx.session.tempCode = userInput;
        
        // --- NEXT: Call the actual login validation function here ---
        // For now, let's stop and verify this message appears.
        
    } else {
        // Handles random messages or codes that don't match the format
        await ctx.reply("I only recognize the /start command or your 5-digit Party Code. Please try again.");
    }
});
