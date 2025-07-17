const { google } = require('googleapis');
const readline = require('readline');

// ========================================
// CONFIGURACIÓN - REEMPLAZA CON TUS DATOS
// ========================================
const CLIENT_ID = 'TU_CLIENT_ID_AQUI';
const CLIENT_SECRET = 'TU_CLIENT_SECRET_AQUI';
const GMAIL_USER = 'tu-email@gmail.com'; // El email de Gmail que usarás para enviar

// Para VPS sin dominio, usamos localhost
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

// ========================================
// NO MODIFICAR DESDE AQUÍ
// ========================================

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose'
];

console.log('🚀 Configurando autenticación de Gmail para VPS');
console.log('==============================================');
console.log(`📧 Email configurado: ${GMAIL_USER}`);
console.log(`🔑 Client ID: ${CLIENT_ID.substring(0, 20)}...`);
console.log('');

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent', // Fuerza a generar refresh token
  include_granted_scopes: true
});

console.log('📋 PASOS A SEGUIR:');
console.log('1. Copia y pega esta URL en tu navegador:');
console.log('');
console.log(authUrl);
console.log('');
console.log('2. Inicia sesión con tu cuenta de Gmail');
console.log('3. Autoriza la aplicación');
console.log('4. Copia el código de autorización de la URL');
console.log('');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('🔐 Ingresa el código de autorización: ', async (code) => {
  try {
    console.log('⏳ Obteniendo tokens...');
    
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('');
    console.log('✅ ¡TOKENS GENERADOS EXITOSAMENTE!');
    console.log('====================================');
    console.log('');
    console.log('📝 VARIABLES DE ENTORNO PARA TU VPS:');
    console.log('====================================');
    console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`GMAIL_USER=${GMAIL_USER}`);
    console.log(`REDIRECT_URI=${REDIRECT_URI}`);
    console.log('');
    console.log('🔒 GUARDA ESTAS VARIABLES EN TU ARCHIVO .env');
    console.log('⚠️  NUNCA COMPARTAS EL REFRESH_TOKEN');
    console.log('');
    console.log('🎯 Access Token (temporal):', tokens.access_token?.substring(0, 20) + '...');
    console.log('🔄 Refresh Token (permanente):', tokens.refresh_token?.substring(0, 20) + '...');
    
    rl.close();
  } catch (error) {
    console.error('❌ Error obteniendo tokens:', error.message);
    console.log('');
    console.log('🔧 POSIBLES SOLUCIONES:');
    console.log('1. Verifica que el Client ID y Secret sean correctos');
    console.log('2. Asegúrate de que tu email esté en "Test users" en Google Cloud Console');
    console.log('3. Verifica que hayas habilitado la Gmail API');
    rl.close();
  }
}); 