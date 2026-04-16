/**
 * Discord webhook para enviar notificaciones al canal del grupo
 */

export async function sendDiscordNotification(content, embed = null) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL not configured');
    return;
  }

  const body = { content };

  if (embed) {
    body.embeds = [{
      title: embed.title,
      description: embed.description,
      color: embed.color || 0x8b5cf6, // violet
      thumbnail: embed.thumbnail ? { url: embed.thumbnail } : undefined,
      fields: embed.fields || [],
      footer: { text: 'The Council' },
      timestamp: new Date().toISOString(),
    }];
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Discord webhook failed: ${res.status}`);
    }
  } catch (err) {
    console.error('Discord notification error:', err.message);
  }
}

// Notificaciones pre-armadas
export async function notifyPhaseChange(phase, monthName) {
  const messages = {
    nomination: `**Fase de Nominación abierta!** Nominen sus juegos para ${monthName}.`,
    voting: `**Votación abierta!** Rankeen los juegos nominados para ${monthName}.`,
    playing: `**Juego del Mes decidido!** A jugar, Council.`,
    review: `**Fase de Review!** Puntúen el juego del mes.`,
    completed: `**Mes completado!** Resultados disponibles en The Council.`,
  };

  await sendDiscordNotification(messages[phase] || `Fase cambiada a: ${phase}`);
}
