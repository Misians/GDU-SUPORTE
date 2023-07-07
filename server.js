const { Client } = require('whatsapp-web.js');
const fs = require('fs');
const qrcode = require("qrcode-terminal");
const axios = require('axios');

let userData = {}; // Armazena os dados do usuário

// Carrega ou cria um arquivo para armazenar os usuários
if (fs.existsSync('knownUsers.json')) {
  knownUsers = require('./knownUsers.json');
}

const client = new Client();

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  // Generate and scan this code with your phone
  console.log('QR RECEIVED', qr);
});

client.on('message', async (msg) => {
  const sender = msg.from;
  const message = msg.body;

  receberDados(sender,message);
  
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', msg => {
  if (msg.body == '!ping') {
    msg.reply('pong');
  }
});

client.initialize();


function receberDados(sender, message){
  if (!userData[sender]) {
    userData[sender] = {}; // Cria um objeto vazio para o número de telefone
    client.sendMessage(sender, 
      'Bem-vindo ao chatsti! Qual seu nome?');
  } 
  else if (!userData[sender].name) {
    userData[sender].name = message;
    console.log('nome:', userData[sender].name);
    client.sendMessage(sender, 'Ótimo, agora me informe o seu e-mail.');
  } else if (!userData[sender].email) {
    userData[sender].email = message;
    console.log('email:', userData[sender].email);
    client.sendMessage(sender, 'Por fim, qual é a sua dúvida?');
  } else {
    userData[sender].inquiry = message;
    console.log('duvida:', userData[sender].inquiry);
    client.sendMessage(sender, 'Obrigado por entrar em contato. Sua dúvida foi recebida!');
    sendDataToPHP(sender);
  }

}
function sendDataToPHP(sender) {
  const data = new URLSearchParams();
  data.append('name', userData[sender].name);
  data.append('email', userData[sender].email);
  data.append('inquiry', userData[sender].inquiry);

  axios.post('http://localhost/pjt-demandas/adicionar.php', data)
    .then(response => {
      console.log('Dados enviados com sucesso!');
      // Faça qualquer ação necessária após enviar os dados
    // Limpar as variáveis de userData
      delete userData[sender].name;
      delete userData[sender].email;
      delete userData[sender].inquiry;

      // Enviar as perguntas novamente
      client.sendMessage(sender, 'Se quiser cadastrar outra dúvida, mande seu nome novamente');
    })
    .catch(error => {
      console.error('Erro ao enviar os dados:', error);
    });
}