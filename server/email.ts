import nodemailer from "nodemailer";
import type { ContractWithRelations } from "@shared/schema";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("Email configuration incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS");
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };
}

function createTransporter() {
  const config = getEmailConfig();
  if (!config) return null;

  return nodemailer.createTransport(config);
}

export async function sendSignatureEmail(
  contract: ContractWithRelations,
  token: string,
  customerEmail: string
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.log("Email not configured, skipping signature email");
    return false;
  }

  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.BASE_URL || "http://localhost:5000";

  const signatureUrl = `${baseUrl}/assinar/${token}`;
  
  const contractTypeNames: Record<string, string> = {
    entry_complement: "Complemento de Entrada",
    purchase_sale: "Compra e Venda",
    vehicle_purchase: "Aquisição de Veículo",
    consignment: "Consignação",
    delivery_protocol: "Protocolo de Entrega",
    consignment_withdrawal: "Retirada em Consignação",
  };

  const contractTypeName = contractTypeNames[contract.contractType] || contract.contractType;
  const vehicleDescription = `${contract.vehicle.brand.name} ${contract.vehicle.model} ${contract.vehicle.year}`;

  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

  const mailOptions = {
    from: `"MayBack Cars" <${fromEmail}>`,
    to: customerEmail,
    subject: `Contrato de ${contractTypeName} - Assinatura Digital`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px; background: #0D0D0C; color: #C1A36A; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .vehicle-info { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .btn { display: inline-block; padding: 15px 30px; background: #C1A36A; color: #0D0D0C; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MayBack Cars</h1>
    </div>
    <div class="content">
      <p>Prezado(a) <strong>${contract.customer.name}</strong>,</p>
      
      <p>Seu contrato de <strong>${contractTypeName}</strong> está pronto para assinatura digital.</p>
      
      <div class="vehicle-info">
        <strong>Veículo:</strong> ${vehicleDescription}<br>
        <strong>Placa:</strong> ${contract.vehicle.plate || "N/A"}<br>
        <strong>Contrato:</strong> #${contract.id}
      </div>
      
      <p>Para assinar o contrato, clique no botão abaixo:</p>
      
      <center>
        <a href="${signatureUrl}" class="btn">Assinar Contrato</a>
      </center>
      
      <div class="warning">
        <strong>Importante:</strong> Para validar sua identidade, você precisará informar os últimos 3 dígitos do seu CPF ou os primeiros 3 dígitos do seu CNPJ.
      </div>
      
      <p>Este link é válido por 48 horas. Após esse período, será necessário solicitar um novo link.</p>
      
      <p>Se você não solicitou este contrato, por favor desconsidere este email.</p>
    </div>
    <div class="footer">
      <p>MayBack Cars - Qualidade e Confiança</p>
      <p>Este é um email automático, não responda.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Prezado(a) ${contract.customer.name},

Seu contrato de ${contractTypeName} está pronto para assinatura digital.

Veículo: ${vehicleDescription}
Placa: ${contract.vehicle.plate || "N/A"}
Contrato: #${contract.id}

Para assinar o contrato, acesse: ${signatureUrl}

Importante: Para validar sua identidade, você precisará informar os últimos 3 dígitos do seu CPF ou os primeiros 3 dígitos do seu CNPJ.

Este link é válido por 48 horas.

MayBack Cars
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Signature email sent to ${customerEmail} for contract #${contract.id}`);
    return true;
  } catch (error) {
    console.error("Failed to send signature email:", error);
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return getEmailConfig() !== null;
}
