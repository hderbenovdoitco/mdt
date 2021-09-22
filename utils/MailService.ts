import nodemailer from 'nodemailer';
import _ from 'lodash';
import { htmlToText } from 'nodemailer-html-to-text';
import { promises as fsPromises } from 'fs';
import * as handlebars from 'handlebars';
export class MailService {
  static sendEmail({ from, to, subject, html }: { from?: string; to: string; subject: string; html: string }): void {
    const { MAILBOX_EMAIL, MAILBOX_PASSWORD } = process.env;
    if ([MAILBOX_EMAIL, MAILBOX_PASSWORD].some((env) => _.isNil(env))) {
      throw new Error('MAILBOX_EMAIL and MAILBOX_PASSWORD should be specified');
    }
    const mailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: MAILBOX_EMAIL,
        pass: MAILBOX_PASSWORD,
      },
    });
    mailTransport.use('compile', htmlToText());
    try {
      mailTransport.sendMail({ from: `MultiDevTools ${from || MAILBOX_EMAIL}`, to, subject, html });
    } catch (err) {
      console.log(err);
    }
  }
  static async formEmailTemplate(templateFile: string, variables: { [key: string]: any }): Promise<string> {
    const templatesFolderPath = './views';
    const template = await fsPromises.readFile(`${templatesFolderPath}/${templateFile}`, { encoding: 'utf8' });
    return handlebars.compile(template)(variables);
  }
}
