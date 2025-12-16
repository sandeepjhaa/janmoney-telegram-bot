const { Telegraf, Markup, session } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const axios = require('axios');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const GAS_URL = process.env.GAS_WEBAPP_URL;

// Define the Main Menu Buttons
const MainMenuKeyboard = Markup.keyboard([
    ['💰 Check Balance', '💸 Transfer Money'],
    ['📊 Leaderboard', '📜 Transaction History'],
    ['📞 Contact Admin', '🚪 Logout']
]).resize(); // .resize() makes the buttons fit nicely on mobile

// Define a function that returns the unique User ID regardless of chat type
const getSessionKey = (ctx) => {
    if (ctx.from && ctx.chat) {
        return String(ctx.from.id);
    }
    return null;
};

// Session middleware
bot.use(
    new LocalSession({ 
        database: 'sessions.json',
        getSessionKey: getSessionKey 
    }).middleware()
);

// Start command
bot.start(async (ctx) => {
    // Reset login state on start
    ctx.session.waitingForLogin = true; 
    
    await ctx.reply(
        `🏦 *National Bank of Bharat* 🇮🇳\n\n` +
        `Welcome to Project Pradhanmantri Banking System!\n\n` +
        `Please login with your 5-digit party code from the Confidential File:\n` +
        `Example: \`BJP01\``,
        { parse_mode: 'Markdown' }
    );
});

// --- MAIN HANDLER: Handles Party Code Login & Validation ---
bot.on('text', async (ctx) => {
    const userInput = ctx.message.text.trim().toUpperCase();

    // 1. Check if we should even be processing a login
    // If user is already logged in, you might want to ignore or show menu
    // For now, we assume any 5-digit code is a login attempt if they aren't authenticated
    
    // 2. Validate Format
    if (!userInput.match(/^[A-Z0-9]{5}$/)) {
        // If it doesn't look like a code, ignore it or show help
        return ctx.reply("I only recognize the /start command or your 5-digit Party Code (e.g. BJP01).");
    }

    // 3. Notify User
    await ctx.reply(`*Code received:* \`${userInput}\`. Running database check...`, { parse_mode: 'Markdown' });

    // 4. DEBUG LOGS
    console.log(`[TRACER] Starting Login for ${userInput}`);
    console.log(`[TRACER] Target URL: ${process.env.GAS_WEBAPP_URL}`);

    try {
        // 5. API Call to Google Apps Script
        const response = await axios.post(process.env.GAS_WEBAPP_URL, {
            action: 'login',
            partyCode: userInput,
            telegramId: ctx.from.id
        });

        // 6. CHECK FOR HTML TRAP (Crucial Check)
        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
            throw new Error("RECEIVED HTML LOGIN PAGE INSTEAD OF JSON. CHECK GAS PERMISSIONS.");
        }

        const partyData = response.data;
        console.log(`[TRACER] API Response Received:`, JSON.stringify(partyData));

        // 7. Handle Script Errors (e.g. "Invalid Party Code")
        if (partyData.error) {
            await ctx.reply(`❌ ${partyData.error}`);
            return;
        }

        // 8. Success: Save Session Data
        ctx.session.partyCode = userInput;
        ctx.session.partyName = partyData.PartyName;
        ctx.session.legalBalance = partyData.LegalBalance;
        ctx.session.blackBalance = partyData.BlackBalance;
        ctx.session.waitingForLogin = false;
        ctx.session.isLoggedIn = true; // Mark as logged in

        await ctx.reply(
            `🎉 *LOGIN SUCCESSFUL!* 🏦\n\n` +
            `Party: *${partyData.PartyName}*\n` +
            `💰 *Current Balance:*\n` +
            `💵 Legal Money: ₹${partyData.LegalBalance} Crore\n` +
            `⚫ Black Money: ₹${partyData.BlackBalance} Crore\n`,
            { 
                parse_mode: 'Markdown',
                ...MainMenuKeyboard // <--- THIS ADDS THE BUTTONS!
            }
        );

    } catch (error) {
        console.error('!!! CRITICAL FAILURE !!!');
        console.error('Error Message:', error.message);
        if (error.response) {
            console.error('Status Code:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
        await ctx.reply('🔧 Connection Failed. Check Render Logs for [TRACER] details.');
    }
});

// --- COMMAND HANDLERS ---

// 1. Balance Check Handler
bot.hears(['💰 Check Balance', '/balance'], async (ctx) => {
    // Security Check: Is user logged in?
    if (!ctx.session.isLoggedIn) {
        return ctx.reply("🔒 Please login with your Party Code first.");
    }

    await ctx.reply("🔄 Fetching latest balance from Bank Server...");

    try {
        // Re-fetch data from Google Sheet to ensure it's up-to-date
        const response = await axios.post(process.env.GAS_WEBAPP_URL, {
            action: 'getParty', // We need to ensure GAS has this case!
            partyCode: ctx.session.partyCode
        });

        const data = response.data;
        
        if (data.error) {
            return ctx.reply(`❌ Error: ${data.error}`);
        }

        // Update Session
        ctx.session.legalBalance = data.LegalBalance;
        ctx.session.blackBalance = data.BlackBalance;

        await ctx.reply(
            `💰 *LATEST BALANCE:*\n\n` +
            `💵 Legal: ₹${data.LegalBalance} Cr\n` +
            `⚫ Black: ₹${data.BlackBalance} Cr`,
            { parse_mode: 'Markdown' }
        );

    } catch (error) {
        console.error("Balance Check Failed:", error.message);
        ctx.reply("⚠️ Network Error. showing last known balance:\n" + 
                  `Legal: ₹${ctx.session.legalBalance} Cr | Black: ₹${ctx.session.blackBalance} Cr`);
    }
});

// 2. Logout Handler
bot.hears(['🚪 Logout', '/logout'], async (ctx) => {
    ctx.session = null; // Clear session
    await ctx.reply("🔒 Logged out successfully. Enter your Party Code to login again.", Markup.removeKeyboard());
});

// --- WEBHOOK SERVER SETUP ---
const PORT = process.env.PORT || 3000;
const RENDER_DOMAIN = 'janmoney-telegram-bot.onrender.com'; 

bot.launch({
    webhook: {
        domain: RENDER_DOMAIN, 
        port: PORT,
        host: '0.0.0.0'
    }
})
.then(() => {
    console.log(`🚀 JanMoney Bot Webhook Listener Started on port ${PORT}`);
})
.catch(err => {
    console.error('FATAL ERROR during Telegraf Webhook launch:', err);
});
