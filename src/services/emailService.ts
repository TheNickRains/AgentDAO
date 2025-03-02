import { SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { sesClient, emailConfig } from '../config/aws';
import { readFileSync } from 'fs';
import path from 'path';

export class EmailService {
  private readonly templatePath: string;

  constructor() {
    this.templatePath = path.join(__dirname, '../../email-template.html');
  }

  private async loadTemplate(): Promise<string> {
    return readFileSync(this.templatePath, 'utf8');
  }

  private async replaceTemplateVariables(template: string, variables: Record<string, string>): Promise<string> {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  public async sendDigest(to: string, proposals: any[], userAddress: string): Promise<void> {
    try {
      const template = await this.loadTemplate();
      const html = await this.replaceTemplateVariables(template, {
        userAddress,
        date: new Date().toLocaleDateString(),
        proposals: JSON.stringify(proposals)
      });

      const params: SendEmailCommandInput = {
        Source: emailConfig.fromEmail,
        Destination: {
          ToAddresses: [to]
        },
        Message: {
          Subject: {
            Data: 'Your DAO Governance Digest'
          },
          Body: {
            Html: {
              Data: html
            }
          }
        },
        ReplyToAddresses: [emailConfig.replyToEmail],
        ReturnPath: emailConfig.bounceEmail
      };

      const command = new SendEmailCommand(params);
      await sesClient.send(command);
    } catch (error) {
      console.error('Error sending digest email:', error);
      throw error;
    }
  }

  public async sendVoteConfirmation(to: string, proposalId: string, choice: string): Promise<void> {
    const params: SendEmailCommandInput = {
      Source: emailConfig.fromEmail,
      Destination: {
        ToAddresses: [to]
      },
      Message: {
        Subject: {
          Data: 'Vote Confirmation'
        },
        Body: {
          Html: {
            Data: `
              <h2>Vote Confirmation</h2>
              <p>Your vote has been recorded:</p>
              <ul>
                <li>Proposal ID: ${proposalId}</li>
                <li>Choice: ${choice}</li>
              </ul>
            `
          }
        }
      },
      ReplyToAddresses: [emailConfig.replyToEmail],
      ReturnPath: emailConfig.bounceEmail
    };

    const command = new SendEmailCommand(params);
    await sesClient.send(command);
  }
} 