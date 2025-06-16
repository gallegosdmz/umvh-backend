import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { handleDBErrors } from 'src/utils/errors';

@Injectable()
export class MailsService {
  private oauth2Client;

  constructor(private configService: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('REDIRECT_URI'),
    );

    this.oauth2Client.setCredentials({
      refresh_token: this.configService.get('GOOGLE_REFRESH_TOKEN')
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      const accessToken = await this.oauth2Client.getAccessToken();
if (!accessToken || !accessToken.token) {
  throw new Error('No se pudo obtener accessToken. Revisa tu refresh_token y credenciales');
}

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: this.configService.get('GMAIL_USER'),
          clientId: this.configService.get('GOOGLE_CLIENT_ID'),
          clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET'),
          refreshToken: this.configService.get('GOOGLE_REFRESH_TOKEN'),
          accessToken: accessToken.token,
        },
      });

      const mailOptions = {
        from: `"Sistema" <${this.configService.get('GMAIL_USER')}>`,
        to,
        subject,
        html,
      };

      const result = await transporter.sendMail(mailOptions);
      return result;

    } catch (error) {
      handleDBErrors(error, 'sendMail - mails');
    }
  }
}
