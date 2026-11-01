import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly frontendUrl: string;
  private readonly passwordResetTtlSeconds: number;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const from = config.get<string>('SMTP_FROM');
    if (
      config.get<string>('NODE_ENV') === 'production' &&
      (!host || !from)
    ) {
      throw new Error('SMTP_HOST and SMTP_FROM must be configured in production');
    }
    const frontend = new URL(
      config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173',
    );
    if (
      !['http:', 'https:'].includes(frontend.protocol) ||
      frontend.username ||
      frontend.password ||
      frontend.search ||
      frontend.hash ||
      (config.get<string>('NODE_ENV') === 'production' &&
        frontend.protocol !== 'https:')
    ) {
      throw new Error('FRONTEND_URL must be an absolute safe HTTP(S) URL');
    }
    this.frontendUrl = frontend.toString().replace(/\/+$/, '');
    this.from = from ?? config.get<string>('SMTP_USER') ?? 'Booking <no-reply@localhost>';
    this.passwordResetTtlSeconds = Number(
      config.get<string>('PASSWORD_RESET_TTL_SECONDS') ?? '1800',
    );

    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: Number(config.get<string>('SMTP_PORT') ?? '587'),
          secure: config.get<string>('SMTP_SECURE') === 'true',
          auth:
            config.get<string>('SMTP_USER') &&
            config.get<string>('SMTP_PASSWORD')
              ? {
                  user: config.getOrThrow<string>('SMTP_USER'),
                  pass: config.getOrThrow<string>('SMTP_PASSWORD'),
                }
              : undefined,
        })
      : null;
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const expiresMinutes = Math.ceil(this.passwordResetTtlSeconds / 60);
    const url = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.send({
      to,
      subject: 'Réinitialisation de votre mot de passe Booking',
      text: `Pour choisir un nouveau mot de passe, ouvrez ce lien (valable ${expiresMinutes} minutes) : ${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`,
      html: `<p>Une demande de réinitialisation de mot de passe a été effectuée.</p><p><a href="${url}">Choisir un nouveau mot de passe</a> (lien valable ${expiresMinutes} minutes).</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>`,
    });
  }

  async sendEmailChangeVerification(to: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    await this.send({
      to,
      subject: 'Confirmez votre nouvelle adresse e-mail',
      text: `Pour confirmer cette adresse e-mail pour votre compte Booking, ouvrez ce lien : ${url}\n\nSi vous n'avez pas demandé ce changement, ignorez cet e-mail.`,
      html: `<p>Confirmez cette adresse e-mail pour votre compte Booking.</p><p><a href="${url}">Confirmer mon adresse e-mail</a></p><p>Si vous n'avez pas demandé ce changement, ignorez cet e-mail.</p>`,
    });
  }

  private async send(message: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.error('SMTP_HOST is not configured; account email was not sent');
      throw new ServiceUnavailableException(
        'Email delivery is temporarily unavailable',
      );
    }

    try {
      await this.transporter.sendMail({ from: this.from, ...message });
    } catch (error) {
      this.logger.error(
        'SMTP delivery failed',
        error instanceof Error ? error.name : 'Unknown SMTP error',
      );
      throw new ServiceUnavailableException(
        'Email delivery is temporarily unavailable',
      );
    }
  }
}
