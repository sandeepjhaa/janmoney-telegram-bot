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
// --- CRITICAL WEBHOOK LISTENING CODE ---

// Render provides the PORT as an environment variable (e.g., 10000)
// The host must listen on 0.0.0.0 to accept external connections
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// 1. Get the domain name from the environment variable you saved
const RENDER_DOMAIN = 'janmoney-telegram-bot.onrender.com';

// 2. Set the Webhook externally (as you've already done)
//    Now, start the web server listening for those pings.

bot.launch({
    // Optional: Use the Express server built into Telegraf to handle the HTTP requests
    webhook: {
        // We only provide the hostname, Telegraf handles the HTTPS part
        domain: RENDER_DOMAIN, 
        // We tell Telegraf to listen on the specific port assigned by Render
        port: PORT,
        host: HOST
    }
})
.then(() => {
    // This log should now appear in your Render console upon successful deployment
    console.log(`🚀 JanMoney Bot Webhook Listener Started on port ${PORT}`);
})
.catch(err => {
    console.error('FATAL ERROR during Telegraf Webhook launch:', err);
});

// IMPORTANT: Delete any previous bot.launch() or bot.startPolling() lines!
