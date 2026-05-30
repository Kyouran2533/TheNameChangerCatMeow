// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
const token = process.env.TOKEN;

// Create a new client instance
const client = new Client({
	intents:[
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, (message) => {
	if (message.content == '!hello') {
		message.channel.send('Hello!');
	}
});

// ===== 稱號設定 =====
const prizes = [
	{ name: '牛奶貓', weight: 2 },
	{ name: '黑貓', weight: 7 },
	{ name: '波斯貓', weight: 10 },
	{ name: '橘貓', weight: 12 },
	{ name: '米克斯', weight: 32 },
	{ name: '英國短毛貓', weight: 10 },
	{ name: '挪威森林貓', weight: 7 },
	{ name: '緬因貓', weight: 5 },
	{ name: '布偶貓', weight: 1 },
	{ name: '三花貓', weight: 14 },
];

// ===== 冷卻時間 =====
// 2小時
const cooldowns = new Map();
const COOLDOWN_TIME = 2 * 60 * 60 * 1000;

// ===== 權重抽獎 =====
// eslint-disable-next-line
function drawPrize(prizes) {

	const totalWeight = prizes.reduce(
		(sum, prize) => sum + prize.weight,
		0,
	);

	const random = Math.random() * totalWeight;

	let currentWeight = 0;

	for (const prize of prizes) {

		currentWeight += prize.weight;

		if (random < currentWeight) {
			return prize.name;
		}
	}

	return prizes[0].name;
}

// ===== 訊息事件 =====
client.on('messageCreate', async (message) => {

	if (message.author.bot) return;

	if (message.content !== '!開罐罐') return;

	const member = message.member;
	const userId = member.id;

	// ===== 冷卻檢查 =====
	const lastDrawTime = cooldowns.get(userId);

	if (lastDrawTime) {

		const elapsed = Date.now() - lastDrawTime;

		if (elapsed < COOLDOWN_TIME) {

			const remaining = COOLDOWN_TIME - elapsed;

			const hours = Math.floor(
				remaining / (1000 * 60 * 60),
			);

			const minutes = Math.floor(
				(remaining % (1000 * 60 * 60))
                / (1000 * 60),
			);

			return message.reply(
				`⏳ 你已經抽過獎了！\n你的附近沒有貓了...請等待 ${hours} 小時 ${minutes} 分鐘後再試。`,
			);
		}
	}

	// ===== 開始抽獎 =====
	const prize = drawPrize(prizes);

	// 原始名稱
	const currentName =
        member.nickname ||
        member.user.username;

	// 移除舊稱號
	const cleanName = currentName.replace(
		/^\([^)]+\)/,
		'',
	);

	// 新暱稱
	const newNickname =
        `(${prize})${cleanName}`;

	try {

		await member.setNickname(
			newNickname,
			'抽獎稱號更新',
		);

		cooldowns.set(
			userId,
			Date.now(),
		);

		await message.channel.send(
			`🎉 ${member} 打開了罐罐 【${prize}】 出現了！！！\n` +
            `新的稱號已更新為：${newNickname}`,
		);

	}
	catch (error) {

		console.error(error);

		await message.reply(
			'❌ 無法修改你的暱稱，請確認 Bot 權限高於你的身分組。',
		);
	}
});

// Log in to Discord with your client's token
client.login(token);