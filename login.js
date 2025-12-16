bot.on('text', async (ctx) => {
    // Only process if waiting for login
    if (ctx.session.waitingForLogin) {
        const partyCode = ctx.message.text.trim().toUpperCase();

        // 1. Validate Format
        if (!partyCode.match(/^[A-Z0-9]{5}$/)) {
            return ctx.reply("⚠️ Invalid format. Please enter the 5-digit code (e.g., BJP01).");
        }

        await ctx.reply(`Code received: ${partyCode}. Running database check...`);
        
        // 2. DEBUG LOGS (Watch Render Logs for these!)
        console.log(`[TRACER] Starting Login for ${partyCode}`);
        console.log(`[TRACER] Target URL: ${process.env.GAS_WEBAPP_URL}`);

        try {
            // 3. API Call
            const response = await axios.post(process.env.GAS_WEBAPP_URL, {
                action: 'login',
                partyCode: partyCode,
                telegramId: ctx.from.id
            });

            // 4. CHECK FOR HTML TRAP (Crucial Fix)
            if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
                throw new Error("RECEIVED HTML LOGIN PAGE INSTEAD OF JSON. CHECK GAS PERMISSIONS.");
            }

            const partyData = response.data;
            console.log(`[TRACER] API Response Received:`, JSON.stringify(partyData));

            if (partyData.error) {
                await ctx.reply(`❌ ${partyData.error}`);
                return;
            }

            // 5. Success Logic
            ctx.session.partyCode = partyCode;
            ctx.session.partyName = partyData.PartyName;
            ctx.session.legalBalance = partyData.LegalBalance;
            ctx.session.blackBalance = partyData.BlackBalance;
            ctx.session.waitingForLogin = false;

            await ctx.reply(`🎉 Login Successful! Welcome ${partyData.PartyName}.`);

        } catch (error) {
            console.error('!!! CRITICAL FAILURE !!!');
            console.error('Error Message:', error.message);
            if (error.response) {
                console.error('Status Code:', error.response.status);
                console.error('Response Data:', error.response.data);
            }
            ctx.session.waitingForLogin = false; 
            await ctx.reply('🔧 Connection Failed. Check Render Logs for [TRACER] details.');
        }
    }
});
