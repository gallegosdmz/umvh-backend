require('dotenv').config();
const { MailsService } = require('./dist/mails/mails.service');
const { ConfigService } = require('@nestjs/config');

// Configurar ConfigService
const configService = new ConfigService();
const mailsService = new MailsService(configService);

async function testEmail() {
  try {
    console.log('📧 Probando envío de correo...');
    console.log('================================');
    
    const result = await mailsService.sendMail(
      'tu-email-destino@gmail.com', // Reemplaza con tu email
      'Prueba de correo desde VPS',
      `
        <h2>¡Hola!</h2>
        <p>Este es un correo de prueba enviado desde tu backend en el VPS.</p>
        <p>Si recibes este correo, significa que la configuración de Gmail está funcionando correctamente.</p>
        <br>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
      `
    );
    
    console.log('✅ Correo enviado exitosamente!');
    console.log('📋 Detalles:', result);
    
  } catch (error) {
    console.error('❌ Error enviando correo:', error.message);
    console.log('');
    console.log('🔧 Verifica:');
    console.log('1. Que las variables de entorno estén configuradas');
    console.log('2. Que el refresh token sea válido');
    console.log('3. Que tu email esté en "Test users" en Google Cloud Console');
  }
}

testEmail(); 