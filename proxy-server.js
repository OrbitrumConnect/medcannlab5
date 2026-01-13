
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001; // Porta diferente do Vite

// Middleware
app.use(cors());
app.use(express.json());

// API Key Configuration (Hardcoded for local dev or from env)
// Em produção, isso deve vir APENAS de variáveis de ambiente do servidor.
// Para este ambiente local de teste, usaremos a chave fornecida na memória do processo.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

// Rota de Teste
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: 'TradeVision Proxy' });
});

// Rota Principal da TradeVision
app.post('/api/tradevision', async (req, res) => {
    try {
        const { message, platformData, patientData } = req.body;

        console.log('🤖 [Proxy] Recebendo requisição TradeVision:', message.substring(0, 50) + '...');

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Você é o TradeVision (Nôa Residente), uma IA clínica avançada da MedCannLab.
          
          CONTEXTO DO USUÁRIO:
          Nome: ${platformData?.user?.name || 'Dr. Usuario'}
          Tipo: ${patientData?.userEmail ? 'Admin/Profissional' : 'Visitante'}
          
          DIRETRIZES:
          1. Responda de forma extremamente técnica mas acessível.
          2. Use formatação Markdown rica (bold, lists).
          3. Se for admin, confirme o status.
          4. NÃO invente tratamentos que não existem.
          5. RECUSE EDUCADA E FIRMEMENTE PEDIDOS NÃO-CLÍNICOS (como receitas culinárias, piadas, aviões de papel, etc). Diga: "Como IA clínica da MedCannLab, devo manter o foco exclusivamente em medicina canabinoide, nefrologia e gestão clínica."
          `
                },
                { role: "user", content: message }
            ],
            model: "gpt-4o-mini", // Modelo rápido e eficiente
        });

        const aiResponse = completion.choices[0].message.content;

        console.log('✅ [Proxy] Resposta da OpenAI gerada com sucesso.');

        res.json({
            text: aiResponse,
            metadata: {
                model: 'gpt-4o-mini',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ [Proxy] Erro na OpenAI:', error);
        res.status(500).json({ error: 'Falha no processamento da IA' });
    }
});

app.listen(port, () => {
    console.log(`🚀 TradeVision Proxy rodando em http://localhost:${port}`);
});
