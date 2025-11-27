const BAILEYS_API_URL = 'http://localhost:3001';

export const whatsappService = {
  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`${BAILEYS_API_URL}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, message }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error sending message via Baileys:', error);
      return false;
    }
  },
};
