const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;
const wsPort = 8080;

// ==========================================================
// CONFIGURAÇÃO DO BANCO DE DADOS MYSQL
// ==========================================================
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // !!! ATUALIZE SUA SENHA !!!
    database: 'rfid_access_log'
};

let dbConnection;

async function connectToDatabase() {
    try {
        dbConnection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado ao banco de dados MySQL com sucesso!');
    } catch (err) {
        console.error('❌ ERRO AO CONECTAR AO BANCO DE DADOS:', err.message);
        setTimeout(connectToDatabase, 5000);
    }
}
connectToDatabase();

async function logAccess(uid, status, nome) {
    if (!dbConnection) {
        console.error('Falha ao registrar: Conexão com o banco de dados não está ativa.');
        return;
    }
    const query = `INSERT INTO access_logs (rfid_uid, status_acesso, nome_usuario) VALUES (?, ?, ?)`;
    try {
        await dbConnection.execute(query, [uid, status, nome]);
        console.log(`[DB LOG] Acesso registrado: UID=${uid}, Status=${status}, Nome=${nome}`);
    } catch (error) {
        console.error('❌ ERRO ao inserir registro no MySQL:', error);
    }
}


// ==========================================================
// 🚨 Lista de Cartões RFID Autorizados (SIMULAÇÃO DE DADOS DO DB)
// ==========================================================
const accessControlList = {
    //                                                                      NOVO CAMPO AQUI!
    "31C3D90E": { status: "LIBERADO", message: "Bem-vindo, Oscar Meira!", nome: "Oscar Meira", photo_path: "oscar.jpg" },
    "0B3F6C05": { status: "LIBERADO", message: "Olá, Maria Souza. Pode entrar!", nome: "Maria Souza", photo_path: "maria.jpg" },
    "DEADBEEF": { status: "BLOQUEADO", message: "Acesso Bloqueado. Fale com a segurança.", nome: "Desconhecido", photo_path: "negado.jpg" } // Imagem padrão para bloqueado
};

const DENIED_MESSAGE = "Acesso Negado! Cartão não cadastrado.";
// ==========================================================

// --- Configuração da Porta Serial (Mesma da versão anterior) ---
const arduinoPort = 'COM12'; // !!! ATUALIZE ESTA PORTA !!!
const serialPort = new SerialPort({
    path: arduinoPort,
    baudRate: 9600,
});

const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
// ... (Serialport event handlers)

// --- Servidor WebSocket (Mesmo da versão anterior) ---
const wss = new WebSocket.Server({ port: wsPort });
// ... (WebSocket event handlers)

console.log(`Servidor WebSocket rodando em ws://localhost:${wsPort}`);

// Lógica de Recebimento, Comparação do RFID e LOG no DB
parser.on('data', data => {
    const cleanedData = data.trim();
    if (cleanedData.startsWith('UID:')) {
        const rfidUID = cleanedData.substring(4).trim();

        let responseData;
        let dbStatus = "NAO_CADASTRADO";
        let dbName = "N/A";
        let photoFile = "negado.jpg"; // Imagem padrão para desconhecidos

        // 1. Verifica se o UID está na lista de controle de acesso
        if (accessControlList[rfidUID]) {
            const user = accessControlList[rfidUID];
            dbStatus = user.status;
            dbName = user.nome;
            photoFile = user.photo_path; // Define a foto do usuário

            responseData = {
                uid: rfidUID,
                status: 'allowed',
                message: user.message,
                accessStatus: dbStatus,
                photoUrl: `/public/images/${photoFile}` // URL COMPLETA para o frontend
            };
        } else {
            // Cartão não encontrado
            responseData = {
                uid: rfidUID,
                status: 'denied',
                message: DENIED_MESSAGE,
                accessStatus: dbStatus,
                photoUrl: `/images/${photoFile}` // Usa a imagem padrão de negado
            };
        }

        // 2. REGISTRA O LOG NO BANCO DE DADOS
        logAccess(rfidUID, dbStatus, dbName);

        // 3. Envia o objeto JSON para todos os clientes WebSocket
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(responseData));
            }
        });
    }
});

// --- Servidor Web (PARA SERVIR ARQUIVOS ESTÁTICOS, INCLUINDO /images) ---
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor Web rodando em http://localhost:${port}`);
});