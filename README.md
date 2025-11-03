
# 🆔 Sistema de Controle de Acesso RFID Web

Este é um projeto completo que integra hardware (Arduino e RFID) com uma aplicação web (Node.js, WebSockets, MySQL) para identificação de usuários em tempo real, registro de acesso em banco de dados e exibição de informações visuais (foto e mensagem).

## 🚀 Funcionalidades

* **Leitura RFID em Tempo Real:** Captura do UID (código único) do cartão RFID via Arduino.
* **Comunicação Serial:** Utiliza Node.js e WebSockets para enviar os dados da porta serial para o navegador em tempo real.
* **Identificação de Usuário:** Verifica o UID lido em uma lista de controle de acesso (simulada ou BD).
* **Registro em Banco de Dados:** Log de todas as tentativas de acesso (liberadas ou negadas) em um banco de dados MySQL.
* **Interface Web Dinâmica:** Exibe uma mensagem personalizada, o status de acesso (Liberado/Negado) e a **foto** do usuário.

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia | Uso |
| :--- | :--- | :--- |
| **Hardware** | Arduino Uno | Microcontrolador central |
| **Hardware** | Módulo RFID RC522 | Leitor de cartões/tags |
| **Backend/Servidor** | Node.js (Express) | Servidor intermediário |
| **Comunicação** | WebSockets (`ws`) | Transmissão de dados em tempo real para o frontend |
| **Serial** | `serialport` | Leitura da porta de comunicação do Arduino |
| **Banco de Dados** | MySQL (`mysql2/promise`) | Armazenamento dos logs de acesso e dados de usuários |
| **Frontend** | HTML, CSS, JavaScript | Interface do usuário |

## 🔌 Configuração de Hardware

### Materiais Necessários

* 1x Placa Arduino Uno (ou compatível)
* 1x Módulo Leitor RFID RC522
* Fios Jumper
* Cartões/Tags RFID compatíveis
* Cabo USB para o Arduino

### Esquema de Conexão (SPI)

O módulo RC522 se comunica usando o protocolo SPI. A ligação padrão no Arduino Uno é a seguinte:

| Pino do RC522 | Pino do Arduino Uno |
| :--- | :--- |
| **3.3V** | 3.3V |
| **GND** | GND |
| **RST** | D9 |
| **MISO** | D12 |
| **MOSI** | D11 |
| **SCK** | D13 |
| **SDA (SS)** | D10 |

## 📂 Estrutura do Projeto
fid_web_reader/ 
├── public/ │ 
            ├── images/ # Pasta onde as fotos dos usuários estão armazenadas (ex: joao_silva.jpg) 
│ 
└── index.html # Interface web (Frontend) 
├── server.js # Servidor Node.js (Backend, Serial, WebSocket e MySQL) 
├── package.json 
└── README.md


## 💻 Instruções de Instalação e Execução

### 1. Arduino (Microcontrolador)

1.  **Instalar Biblioteca:** No Arduino IDE, instale a biblioteca **`MFRC522`** (por Miguel Balboa).
2.  **Upload do Código:** Copie o código do *Sketch Arduino* (`RFID_Reader_Serial.ino`) e faça o upload para a placa.
    > ⚠️ **IMPORTANTE:** O Monitor Serial da IDE deve estar **FECHADO** ao rodar o Node.js, pois apenas um programa pode acessar a porta serial por vez.

### 2. Banco de Dados (MySQL)

1.  **Crie o BD:** Execute o SQL no seu servidor MySQL:
    ```sql
    CREATE DATABASE rfid_access_log;
    USE rfid_access_log;
    ```
2.  **Crie a Tabela de Logs:**
    ```sql
    CREATE TABLE access_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rfid_uid VARCHAR(50) NOT NULL,
        nome_usuario VARCHAR(100),
        status_acesso VARCHAR(20) NOT NULL,
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    ```
3.  **Crie a Tabela de Usuários (ACL):** Para um projeto mais robusto, use esta tabela para popular a ACL no Node.js (ou use-a como fonte única de dados).
    ```sql
    CREATE TABLE usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rfid_uid VARCHAR(50) UNIQUE NOT NULL,
        nome_usuario VARCHAR(100) NOT NULL,
        photo_path VARCHAR(255),               -- Ex: "joao_silva.jpg"
        status_acesso VARCHAR(20) DEFAULT 'LIBERADO'
    );
    INSERT INTO usuarios (rfid_uid, nome_usuario, photo_path) VALUES 
    ('1A2B3C4D', 'João Silva', 'joao_silva.jpg');
    ```

### 3. Servidor Node.js (Backend)

1.  **Instale Dependências:** Na pasta raiz do projeto, execute:
    ```bash
    npm install express serialport ws mysql2
    ```
2.  **Configure Credenciais:** No arquivo `server.js`, atualize as seguintes variáveis:
    * `const arduinoPort = 'COM3';` (Mude para a porta serial correta do seu Arduino, ex: `/dev/ttyUSB0` ou `COM4`).
    * As credenciais em `const dbConfig` (host, user, password, database).
3.  **Execute o Servidor:**
    ```bash
    node server.js
    ```
    O terminal exibirá a confirmação da conexão serial, MySQL e o endereço do servidor web.

### 4. Interface Web (Frontend)

1.  **Acesse o Navegador:** Abra o navegador na seguinte URL:
    ```
    http://localhost:3000
    ```
2.  **Teste:** Aproxime um cartão RFID do leitor para ver a foto, o status e a mensagem serem exibidos, enquanto o log é gravado no MySQL.

## 🔑 Próximos Passos Sugeridos

* **Busca em BD em Tempo Real:** Em vez de manter a ACL no `server.js`, modifique o código para realizar uma consulta MySQL (`SELECT`) a cada leitura RFID.
* **Controle de Saída:** Envie um comando de volta para o Arduino (via serial) para acionar um atuador (ex: relé para abrir uma porta) quando o acesso for liberado.
* **Interface de Gerenciamento:** Crie rotas HTTP (`/admin`) para adicionar, remover e editar usuários no banco de dados através de um formulário web.
