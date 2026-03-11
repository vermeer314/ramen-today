export const sendDiscordNotification = async (
  type: string,
  shopName: string,
  sourceUrl: string,
) => {
  const webhookUrl =
    type === 'event'
      ? import.meta.env.VITE_DISCORD_WEBHOOK_EVENT
      : import.meta.env.VITE_DISCORD_WEBHOOK_CLOSING;

  if (!webhookUrl) return;

  const isEvent = type === 'event';

  const message = {
    embeds: [
      {
        title: isEvent ? '🍜 새로운 이벤트 제보' : '📢 영업 변동 제보',
        color: isEvent ? 2226226 : 15158332,
        fields: [
          {
            name: '가게 이름',
            value: shopName,
            inline: true,
          },
          {
            name: '원본 링크',
            value: `[확인하기](${sourceUrl})`,
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Discord webhook error:', error);
  }
};
