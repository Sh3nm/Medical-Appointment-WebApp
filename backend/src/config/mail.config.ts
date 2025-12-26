import { MailerOptions } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';

export const mailerConfig: MailerOptions = {
  transport: {
    host: 'smtp.gmail.com', // Gmail SMTP
    port: 587,
    secure: false, // true untuk port 465, false untuk port 587
    auth: {
      user: 'bookdokter24@gmail.com', // Nanti ganti ke email pengirim
      pass: 'mkqq hsme sezt lepg',    // Ganti dengan App Password/Token
    },
  },
  // Default Options (Pengirim dan Template)
  defaults: {
    from: '"Medical App" <bookdokter24@gmail.com>',
  },
  template: {
    // Template Engine yang digunakan (misalnya Pug)
    dir: process.cwd() + '/src/templates', 
    adapter: new PugAdapter(),
    options: {
      strict: true,
    },
  },
};