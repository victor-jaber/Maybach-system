import type { Express } from "express";
import { createServer, type Server } from "http";
import PDFDocument from "pdfkit";
import crypto from "crypto";
import { storage } from "./storage";
import { registerAuthRoutes, isAuthenticated, seedAdminUser } from "./auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { sendSignatureEmail, sendSignedContractEmail, isEmailConfigured } from "./email";
import { 
  getEntryComplementContract, 
  getPurchaseSaleContract, 
  getVehiclePurchaseContract,
  getConsignmentContract,
  getDeliveryProtocol,
  getConsignmentWithdrawalProtocol,
  type ContractData 
} from "./contract-templates";
import {
  insertBrandSchema,
  insertCategorySchema,
  insertVehicleApiSchema,
  insertCustomerApiSchema,
  insertSaleApiSchema,
  insertStoreSchema,
  insertContractApiSchema,
} from "@shared/schema";
import { z } from "zod";

function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "R$ 0,00";
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numericValue)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numericValue);
}

function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return "";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return "";
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR");
}

interface SignatureInfo {
  storeSigned: boolean;
  storeSignedAt?: Date;
  storeSignedBy?: string;
  customerSigned: boolean;
  customerSignedAt?: Date;
  customerName?: string;
  customerDocument?: string;
  customerIp?: string;
}

async function generateSignedPdfBuffer(
  contract: any,
  store: any,
  signatureInfo: SignatureInfo
): Promise<{ buffer: Buffer; fileName: string }> {
  const buildAddress = (obj: { street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null; cep?: string | null }) => {
    const parts = [];
    if (obj.street) parts.push(obj.street);
    if (obj.number) parts.push(`nº ${obj.number}`);
    if (obj.complement) parts.push(obj.complement);
    if (obj.neighborhood) parts.push(`Bairro ${obj.neighborhood}`);
    if (obj.city && obj.state) parts.push(`${obj.city}/${obj.state}`);
    if (obj.cep) parts.push(`CEP ${obj.cep}`);
    return parts.join(", ") || "Não informado";
  };

  const contractData: ContractData = {
    razaoSocialLoja: store?.razaoSocial || "Não informado",
    cnpjLoja: formatCNPJ(store?.cnpj) || "Não informado",
    enderecoLoja: store ? buildAddress(store) : "Não informado",
    representanteLoja: store?.representanteLegal || "Não informado",
    cpfRepresentanteLoja: formatCPF(store?.cpfRepresentante) || "Não informado",
    telefoneLoja: store?.phone || "Não informado",
    
    nomeCliente: contract.customer?.name || "Não informado",
    cpfCnpjCliente: contract.customer?.cpfCnpj?.length === 11 
      ? formatCPF(contract.customer.cpfCnpj) 
      : formatCNPJ(contract.customer?.cpfCnpj),
    tipoDocumentoCliente: (contract.customer?.cpfCnpj?.replace(/\D/g, "").length === 11 ? "CPF" : "CNPJ") as "CPF" | "CNPJ",
    rgCliente: contract.customer?.rg || "Não informado",
    cnhCliente: contract.customer?.cnh || "Não informado",
    enderecoCliente: contract.customer ? buildAddress(contract.customer) : "Não informado",
    telefoneCliente: contract.customer?.phone || "Não informado",
    emailCliente: contract.customer?.email || "Não informado",
    
    marca: contract.vehicle?.brand?.name || "Não informado",
    modelo: contract.vehicle?.model || "Não informado",
    ano: contract.vehicle?.year?.toString() || "Não informado",
    cor: contract.vehicle?.color || "Não informado",
    placa: contract.vehicle?.plate || "Não informado",
    chassi: contract.vehicle?.chassis || "Não informado",
    renavam: contract.vehicle?.renavam || "Não informado",
    km: contract.vehicle?.mileage?.toLocaleString("pt-BR") || "0",
    
    valorVeiculo: formatCurrency(contract.valorVenda),
    entradaTotal: formatCurrency(contract.entradaTotal),
    entradaPaga: formatCurrency(contract.entradaPaga),
    entradaRestante: formatCurrency(contract.entradaRestante),
    valorFinanciado: formatCurrency(contract.valorFinanciado),
    bancoFinanciador: contract.bancoFinanciamento || "",
    
    formaPagamento: (contract.formaPagamentoRestante as "avista" | "parcelado") || "avista",
    dataVencimentoAvista: formatDate(contract.dataVencimentoAvista),
    quantidadeParcelas: contract.quantidadeParcelas || 0,
    valorParcela: formatCurrency(contract.valorParcela),
    diaVencimento: contract.diaVencimento || 1,
    formaPagamentoParcelas: contract.formaPagamentoParcelas || "",
    
    multaPercentual: contract.multaAtraso?.toString() || "2",
    jurosMensal: contract.jurosAtraso?.toString() || "1",
    
    cidadeForo: store?.city || "São Paulo",
    dataEmissao: formatDate(new Date()),
    
    tradeInMarca: contract.tradeInVehicle?.brand?.name || undefined,
    tradeInModelo: contract.tradeInVehicle?.model || undefined,
    tradeInAno: contract.tradeInVehicle?.year?.toString() || undefined,
    tradeInCor: contract.tradeInVehicle?.color || undefined,
    tradeInPlaca: contract.tradeInVehicle?.plate || undefined,
    tradeInChassi: contract.tradeInVehicle?.chassis || undefined,
    tradeInRenavam: contract.tradeInVehicle?.renavam || undefined,
    tradeInKm: contract.tradeInVehicle?.mileage?.toLocaleString("pt-BR") || undefined,
    tradeInValor: contract.tradeInValue ? formatCurrency(contract.tradeInValue) : undefined,
    tradeInObservacoes: contract.tradeInNotes || undefined,
  };

  let contractText = "";
  let contractFileName = "contrato";
  
  switch (contract.contractType) {
    case "entry_complement":
      contractText = getEntryComplementContract(contractData);
      contractFileName = "complemento_entrada";
      break;
    case "purchase_sale":
      contractText = getPurchaseSaleContract(contractData);
      contractFileName = "compra_venda";
      break;
    case "vehicle_purchase":
      contractText = getVehiclePurchaseContract(contractData);
      contractFileName = "aquisicao_veiculo";
      break;
    case "consignment":
      contractText = getConsignmentContract(contractData);
      contractFileName = "consignacao";
      break;
    case "delivery_protocol":
      contractText = getDeliveryProtocol(contractData);
      contractFileName = "protocolo_entrega";
      break;
    case "consignment_withdrawal":
      contractText = getConsignmentWithdrawalProtocol(contractData);
      contractFileName = "protocolo_retirada";
      break;
    default:
      contractText = getPurchaseSaleContract(contractData);
      contractFileName = "contrato";
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve({ buffer: pdfBuffer, fileName: `${contractFileName}_${contract.id}.pdf` });
    });
    doc.on("error", reject);

    const lines = contractText.trim().split("\n");
    const storeRoles = ["VENDEDORA", "CONSIGNATÁRIA", "RECEBEDOR", "COMPRADORA"];
    const customerRoles = ["COMPRADOR", "CONSIGNANTE", "PROPRIETÁRIO", "ENTREGANTE", "RETIRANTE"];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i < lines.length - 1 ? lines[i + 1] : "";
      
      if (line.trim() === "") {
        doc.moveDown(0.5);
      } else if (line.match(/^CLÁUSULA|^CONTRATO PARTICULAR|^PROTOCOLO DE/)) {
        doc.fontSize(11).font("Helvetica-Bold").text(line.trim(), { align: "left" });
        doc.font("Helvetica").fontSize(10);
      } else if (line.match(/^IDENTIFICAÇÃO|^DATA E HORA|^CHECKLIST|^CONDIÇÃO|^DECLARAÇÃO|^ASSINATURAS|^MOTIVO|^ITENS/)) {
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica-Bold").text(line.trim(), { align: "left" });
        doc.font("Helvetica").fontSize(10);
      } else if (line.match(/^\d+\.\d+\./)) {
        doc.fontSize(10).font("Helvetica").text(line.trim(), { align: "justify", indent: 0 });
      } else if (line.trim().startsWith("a)") || line.trim().startsWith("b)") || line.trim().startsWith("c)") || line.trim().startsWith("d)") || line.trim().startsWith("e)")) {
        doc.fontSize(10).font("Helvetica").text(line.trim(), { align: "left", indent: 20 });
      } else if (line.trim().startsWith("[ ]") || line.trim().startsWith("[X]") || line.trim().startsWith("[ X ]")) {
        doc.fontSize(10).font("Helvetica").text(line.trim(), { align: "left", indent: 10 });
      } else if (line.includes("_____")) {
        // Check if next line contains a role for signature
        const isStoreSignature = storeRoles.some(role => nextLine.includes(role) && !customerRoles.some(cr => nextLine.includes(cr)));
        const isCustomerSignature = customerRoles.some(role => nextLine.includes(role));
        
        doc.moveDown(1);
        
        if (isStoreSignature && signatureInfo.storeSigned) {
          // Store signature - render digital signature
          doc.fontSize(10).font("Helvetica-Bold").text("ASSINADO DIGITALMENTE", { align: "center" });
          doc.fontSize(9).font("Helvetica").text(`${store?.razaoSocial || "MayBack Cars"}`, { align: "center" });
          doc.fontSize(8).font("Helvetica").text(`CNPJ: ${formatCNPJ(store?.cnpj)}`, { align: "center" });
          const roleMatch = nextLine.match(/(VENDEDORA|CONSIGNATÁRIA|RECEBEDOR|COMPRADORA)/);
          const role = roleMatch ? roleMatch[1] : "VENDEDORA";
          doc.fontSize(8).font("Helvetica").text(`Data: ${formatDate(signatureInfo.storeSignedAt)} | ${role}`, { align: "center" });
          // Skip the next line (role label) since we included it
          i++;
        } else if (isCustomerSignature && signatureInfo.customerSigned) {
          // Customer signature - render digital signature
          doc.fontSize(10).font("Helvetica-Bold").text("ASSINADO DIGITALMENTE", { align: "center" });
          doc.fontSize(9).font("Helvetica").text(`${signatureInfo.customerName}`, { align: "center" });
          doc.fontSize(8).font("Helvetica").text(`${signatureInfo.customerDocument}`, { align: "center" });
          const roleMatch = nextLine.match(/(COMPRADOR|CONSIGNANTE|PROPRIETÁRIO|ENTREGANTE|RETIRANTE)/);
          const role = roleMatch ? roleMatch[1] : "COMPRADOR";
          doc.fontSize(8).font("Helvetica").text(`Data: ${formatDate(signatureInfo.customerSignedAt)} | IP: ${signatureInfo.customerIp} | ${role}`, { align: "center" });
          // Skip the next line (role label) since we included it
          i++;
        } else {
          // No signature - render the underscore line as is
          doc.fontSize(10).font("Helvetica").text(line.trim(), { align: "center" });
        }
      } else if (line.trim().match(/^(VENDEDORA|COMPRADOR|CONSIGNATÁRIA|CONSIGNANTE|ENTREGANTE|RECEBEDOR):/)) {
        doc.fontSize(10).font("Helvetica-Bold").text(line.trim(), { align: "left" });
        doc.font("Helvetica");
      } else if (line.trim().startsWith("TESTEMUNHAS:")) {
        doc.moveDown(1);
        doc.fontSize(10).font("Helvetica-Bold").text(line.trim(), { align: "left" });
        doc.font("Helvetica");
      } else if (line.trim().startsWith("DECLARO") || line.trim().startsWith("Por meio deste")) {
        doc.fontSize(10).font("Helvetica-Bold").text(line.trim(), { align: "justify" });
        doc.font("Helvetica");
      } else {
        doc.fontSize(10).font("Helvetica").text(line.trim(), { align: "justify" });
      }
    }

    // Add digital signature attestation at the end
    if (signatureInfo.storeSigned || signatureInfo.customerSigned) {
      doc.moveDown(2);
      doc.fontSize(8).font("Helvetica-Bold").text("CERTIFICADO DE ASSINATURA DIGITAL", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(7).font("Helvetica").text(
        "Este documento foi assinado digitalmente conforme a Medida Provisória nº 2.200-2/2001, " +
        "que instituiu a Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil). " +
        "A assinatura digital tem a mesma validade jurídica de uma assinatura manuscrita.",
        { align: "center" }
      );
      doc.moveDown(1);
      
      if (signatureInfo.storeSigned) {
        doc.fontSize(7).font("Helvetica").text(
          `Assinatura VENDEDORA: ${store?.razaoSocial} - ${formatDate(signatureInfo.storeSignedAt)}`,
          { align: "left" }
        );
      }
      
      if (signatureInfo.customerSigned) {
        doc.fontSize(7).font("Helvetica").text(
          `Assinatura COMPRADOR: ${signatureInfo.customerName} - ${formatDate(signatureInfo.customerSignedAt)} - IP: ${signatureInfo.customerIp}`,
          { align: "left" }
        );
      }
    }

    doc.end();
  });
}

const updateAdminUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup JWT authentication routes
  registerAuthRoutes(app);
  
  // Setup object storage routes for file uploads
  registerObjectStorageRoutes(app);
  
  // Seed default admin user
  await seedAdminUser();

  // Brands
  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.post("/api/brands", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertBrandSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const brand = await storage.createBrand(parsed.data);
      res.status(201).json(brand);
    } catch (error) {
      console.error("Error creating brand:", error);
      res.status(500).json({ message: "Failed to create brand" });
    }
  });

  app.patch("/api/brands/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const brand = await storage.updateBrand(id, req.body);
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }
      res.json(brand);
    } catch (error) {
      console.error("Error updating brand:", error);
      res.status(500).json({ message: "Failed to update brand" });
    }
  });

  app.delete("/api/brands/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBrand(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting brand:", error);
      res.status(500).json({ message: "Failed to delete brand" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const category = await storage.createCategory(parsed.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateCategory(id, req.body);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Vehicles (public)
  app.get("/api/vehicles/public", async (req, res) => {
    try {
      const vehicles = await storage.getAvailableVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching public vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/public/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      if (!vehicle || vehicle.status !== "available") {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching public vehicle:", error);
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  // Vehicles (admin)
  app.get("/api/vehicles", isAuthenticated, async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/search/plate/:plate", isAuthenticated, async (req, res) => {
    try {
      const plate = req.params.plate;
      const vehicle = await storage.getVehicleByPlate(plate);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found", found: false });
      }
      res.json({ ...vehicle, found: true });
    } catch (error) {
      console.error("Error searching vehicle by plate:", error);
      res.status(500).json({ message: "Failed to search vehicle" });
    }
  });

  app.get("/api/vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles", isAuthenticated, async (req, res) => {
    try {
      // Sanitize price: remove R$, dots (thousand separators), and convert comma to period
      if (req.body.price !== undefined && req.body.price !== null) {
        req.body.price = String(req.body.price)
          .replace(/R\$\s*/g, "")
          .replace(/\./g, "")
          .replace(",", ".")
          .trim();
      }
      if (req.body.purchasePrice !== undefined && req.body.purchasePrice !== null) {
        req.body.purchasePrice = String(req.body.purchasePrice)
          .replace(/R\$\s*/g, "")
          .replace(/\./g, "")
          .replace(",", ".")
          .trim();
      }
      const parsed = insertVehicleApiSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const vehicle = await storage.createVehicle(parsed.data as any);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.patch("/api/vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Sanitize price if present
      if (req.body.price && typeof req.body.price === "string") {
        req.body.price = req.body.price
          .replace(/R\$\s*/g, "")
          .replace(/\./g, "")
          .replace(",", ".")
          .trim();
      }
      const vehicle = await storage.updateVehicle(id, req.body);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVehicle(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Vehicle Images
  app.get("/api/vehicles/:vehicleId/images", isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const images = await storage.getVehicleImages(vehicleId);
      res.json(images);
    } catch (error) {
      console.error("Error fetching vehicle images:", error);
      res.status(500).json({ message: "Failed to fetch vehicle images" });
    }
  });

  app.post("/api/vehicles/:vehicleId/images", isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const { imageUrl, isPrimary = false, order = 0 } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }
      
      const image = await storage.addVehicleImage({
        vehicleId,
        imageUrl,
        isPrimary,
        order,
      });
      res.status(201).json(image);
    } catch (error) {
      console.error("Error adding vehicle image:", error);
      res.status(500).json({ message: "Failed to add vehicle image" });
    }
  });

  app.patch("/api/vehicles/:vehicleId/images/:imageId", isAuthenticated, async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      const image = await storage.updateVehicleImage(imageId, req.body);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      console.error("Error updating vehicle image:", error);
      res.status(500).json({ message: "Failed to update vehicle image" });
    }
  });

  app.delete("/api/vehicles/:vehicleId/images/:imageId", isAuthenticated, async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      await storage.deleteVehicleImage(imageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vehicle image:", error);
      res.status(500).json({ message: "Failed to delete vehicle image" });
    }
  });

  app.post("/api/vehicles/:vehicleId/images/:imageId/primary", isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const imageId = parseInt(req.params.imageId);
      await storage.setVehiclePrimaryImage(vehicleId, imageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting primary image:", error);
      res.status(500).json({ message: "Failed to set primary image" });
    }
  });

  // Vehicle Documents
  app.get("/api/vehicles/:vehicleId/documents", isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const documents = await storage.getVehicleDocuments(vehicleId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching vehicle documents:", error);
      res.status(500).json({ message: "Erro ao buscar documentos" });
    }
  });

  app.post("/api/vehicles/:vehicleId/documents", isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const { documentUrl, documentName, documentType, description } = req.body;
      const document = await storage.addVehicleDocument({
        vehicleId,
        documentUrl,
        documentName,
        documentType,
        description,
      });
      res.json(document);
    } catch (error) {
      console.error("Error adding vehicle document:", error);
      res.status(500).json({ message: "Erro ao adicionar documento" });
    }
  });

  app.delete("/api/vehicles/:vehicleId/documents/:documentId", isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      await storage.deleteVehicleDocument(documentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vehicle document:", error);
      res.status(500).json({ message: "Erro ao excluir documento" });
    }
  });

  // Vehicle Costs (purchase costs)
  app.get("/api/vehicles/:vehicleId/costs", isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const costs = await storage.getVehicleCosts(vehicleId);
      res.json(costs);
    } catch (error) {
      console.error("Error fetching vehicle costs:", error);
      res.status(500).json({ message: "Erro ao buscar custos" });
    }
  });

  app.post("/api/vehicles/:vehicleId/costs", isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const { description, value, date, notes } = req.body;
      const cost = await storage.addVehicleCost({
        vehicleId,
        description,
        value,
        date: date ? new Date(date) : new Date(),
        notes,
      });
      res.json(cost);
    } catch (error) {
      console.error("Error adding vehicle cost:", error);
      res.status(500).json({ message: "Erro ao adicionar custo" });
    }
  });

  app.patch("/api/vehicles/:vehicleId/costs/:costId", isAuthenticated, async (req, res) => {
    try {
      const costId = parseInt(req.params.costId);
      const { description, value, date, notes } = req.body;
      const updated = await storage.updateVehicleCost(costId, {
        description,
        value,
        date: date ? new Date(date) : undefined,
        notes,
      });
      if (!updated) {
        return res.status(404).json({ message: "Custo não encontrado" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating vehicle cost:", error);
      res.status(500).json({ message: "Erro ao atualizar custo" });
    }
  });

  app.delete("/api/vehicles/:vehicleId/costs/:costId", isAuthenticated, async (req, res) => {
    try {
      const costId = parseInt(req.params.costId);
      await storage.deleteVehicleCost(costId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vehicle cost:", error);
      res.status(500).json({ message: "Erro ao excluir custo" });
    }
  });

  // Customers
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertCustomerApiSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const customer = await storage.createCustomer(parsed.data as any);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.updateCustomer(id, req.body);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomer(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Sales
  app.get("/api/sales", isAuthenticated, async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      console.error("Error fetching sale:", error);
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.post("/api/sales", isAuthenticated, async (req, res) => {
    try {
      // Sanitizar valores monetários
      const moneyFields = ["totalValue", "downPayment", "financedValue", "installmentValue", "tradeInValue"];
      moneyFields.forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== null) {
          req.body[field] = String(req.body[field])
            .replace(/R\$\s*/g, "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim();
        }
      });

      const parsed = insertSaleApiSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const sale = await storage.createSale(parsed.data as any);
      res.status(201).json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  app.delete("/api/sales/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSale(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sale:", error);
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // Admin Users Management
  app.get("/api/admin/users", isAuthenticated, async (req, res) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Acesso não autorizado" });
      }
      const users = await storage.getAdminUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", isAuthenticated, async (req, res) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Acesso não autorizado" });
      }
      
      const parsed = updateAdminUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.errors });
      }
      
      const id = req.params.id;
      const user = await storage.updateAdminUser(id, parsed.data);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, async (req, res) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Acesso não autorizado" });
      }
      const id = req.params.id;
      if (id === req.user?.id) {
        return res.status(400).json({ message: "Você não pode excluir seu próprio usuário" });
      }
      await storage.deleteAdminUser(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // FIPE API Routes - Using parallelum public API
  const FIPE_API_URL = "https://fipe.parallelum.com.br/api/v2";

  app.get("/api/fipe/types", isAuthenticated, async (_req, res) => {
    try {
      const types = [
        { id: "cars", name: "Carros" },
        { id: "motorcycles", name: "Motos" },
        { id: "trucks", name: "Caminhões" },
      ];
      res.json(types);
    } catch (error) {
      console.error("Error fetching FIPE types:", error);
      res.status(500).json({ message: "Erro ao consultar API FIPE" });
    }
  });

  app.get("/api/fipe/brands/:typeId", isAuthenticated, async (req, res) => {
    try {
      const { typeId } = req.params;
      const response = await fetch(`${FIPE_API_URL}/${typeId}/brands`, {
        headers: { accept: "application/json" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("FIPE brands error:", errorText);
        return res.status(response.status).json({ message: "Erro ao buscar marcas" });
      }
      const data = await response.json();
      const formatted = data.map((item: { code: string; name: string }) => ({
        id: item.code,
        name: item.name,
      }));
      res.json(formatted);
    } catch (error) {
      console.error("Error fetching FIPE brands:", error);
      res.status(500).json({ message: "Erro ao consultar API FIPE" });
    }
  });

  app.get("/api/fipe/models/:typeId/:brandId", isAuthenticated, async (req, res) => {
    try {
      const { typeId, brandId } = req.params;
      const response = await fetch(`${FIPE_API_URL}/${typeId}/brands/${brandId}/models`, {
        headers: { accept: "application/json" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("FIPE models error:", errorText);
        return res.status(response.status).json({ message: "Erro ao buscar modelos" });
      }
      const data = await response.json();
      const formatted = data.map((item: { code: string; name: string }) => ({
        id: item.code,
        name: item.name,
      }));
      res.json(formatted);
    } catch (error) {
      console.error("Error fetching FIPE models:", error);
      res.status(500).json({ message: "Erro ao consultar API FIPE" });
    }
  });

  app.get("/api/fipe/years/:typeId/:brandId/:modelId", isAuthenticated, async (req, res) => {
    try {
      const { typeId, brandId, modelId } = req.params;
      const response = await fetch(`${FIPE_API_URL}/${typeId}/brands/${brandId}/models/${modelId}/years`, {
        headers: { accept: "application/json" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("FIPE years error:", errorText);
        return res.status(response.status).json({ message: "Erro ao buscar anos" });
      }
      const data = await response.json();
      const formatted = data.map((item: { code: string; name: string }) => {
        const parts = item.name.split(" ");
        const year = parts[0];
        const fuel = parts.slice(1).join(" ") || "Gasolina";
        return {
          id: item.code,
          year: year,
          fuel: fuel,
        };
      });
      res.json(formatted);
    } catch (error) {
      console.error("Error fetching FIPE years:", error);
      res.status(500).json({ message: "Erro ao consultar API FIPE" });
    }
  });

  app.get("/api/fipe/price/:typeId/:brandId/:modelId/:yearId", isAuthenticated, async (req, res) => {
    try {
      const { typeId, brandId, modelId, yearId } = req.params;
      const response = await fetch(`${FIPE_API_URL}/${typeId}/brands/${brandId}/models/${modelId}/years/${yearId}`, {
        headers: { accept: "application/json" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("FIPE price error:", errorText);
        return res.status(response.status).json({ message: "Erro ao buscar preço" });
      }
      const data = await response.json();
      const priceStr = data.price?.replace(/[^\d,]/g, "").replace(",", ".") || "0";
      const priceValue = parseFloat(priceStr) || 0;
      res.json({
        brand: { id: brandId, name: data.brand },
        model: { id: modelId, name: data.model },
        year: { id: yearId, name: `${data.modelYear} ${data.fuel}` },
        type: { id: typeId, name: typeId },
        price: priceValue,
        id: data.codeFipe,
        referenceMonth: data.referenceMonth,
      });
    } catch (error) {
      console.error("Error fetching FIPE price:", error);
      res.status(500).json({ message: "Erro ao consultar API FIPE" });
    }
  });

  // Store Settings
  app.get("/api/store", isAuthenticated, async (req, res) => {
    try {
      const store = await storage.getStore();
      res.json(store || null);
    } catch (error) {
      console.error("Error fetching store:", error);
      res.status(500).json({ message: "Erro ao buscar dados da loja" });
    }
  });

  app.post("/api/store", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertStoreSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.errors });
      }
      const store = await storage.createOrUpdateStore(parsed.data);
      res.json(store);
    } catch (error) {
      console.error("Error saving store:", error);
      res.status(500).json({ message: "Erro ao salvar dados da loja" });
    }
  });

  // Contracts
  app.get("/api/contracts", isAuthenticated, async (req, res) => {
    try {
      const contracts = await storage.getContracts();
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Erro ao buscar contratos" });
    }
  });

  app.get("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ message: "Erro ao buscar contrato" });
    }
  });

  app.post("/api/contracts", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertContractApiSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.errors });
      }
      const contract = await storage.createContract(parsed.data as any);
      res.status(201).json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(500).json({ message: "Erro ao criar contrato" });
    }
  });

  app.patch("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.updateContract(id, req.body);
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(500).json({ message: "Erro ao atualizar contrato" });
    }
  });

  app.delete("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContract(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contract:", error);
      res.status(500).json({ message: "Erro ao excluir contrato" });
    }
  });

  app.post("/api/contracts/:id/generate-pdf", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }

      const store = await storage.getStore();

      // Check if contract is signed to include customer signature
      let signatureInfoData: SignatureInfo;
      
      if (contract.status === "signed") {
        // Get signature info for signed contracts
        const signatures = await storage.getContractSignaturesByContractId(id);
        const signedSignature = signatures.find(s => s.status === "signed");
        
        signatureInfoData = {
          storeSigned: true,
          storeSignedAt: contract.createdAt || new Date(),
          customerSigned: !!signedSignature,
          customerSignedAt: signedSignature?.signedAt || new Date(),
          customerName: contract.customer?.name || "Cliente",
          customerDocument: contract.customer?.cpfCnpj?.length === 11 
            ? `CPF: ${formatCPF(contract.customer?.cpfCnpj)}` 
            : `CNPJ: ${formatCNPJ(contract.customer?.cpfCnpj)}`,
          customerIp: signedSignature?.signedIp || "N/A",
        };
      } else {
        // Generate PDF with store signature pre-applied only
        signatureInfoData = {
          storeSigned: true,
          storeSignedAt: new Date(),
          customerSigned: false,
        };
      }

      const { buffer: pdfBuffer, fileName } = await generateSignedPdfBuffer(contract, store, signatureInfoData);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Erro ao gerar PDF do contrato" });
    }
  });

  // Serve signed PDF (regenerates on demand with stored signature data)
  app.get("/api/contracts/:id/pdf/signed", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }

      // Check if contract is signed
      if (contract.status !== "signed") {
        return res.status(400).json({ message: "Este contrato ainda não foi assinado digitalmente" });
      }

      // Get signature info
      const signatures = await storage.getContractSignaturesByContractId(id);
      const signedSignature = signatures.find(s => s.status === "signed");
      
      if (!signedSignature) {
        return res.status(400).json({ message: "Assinatura não encontrada" });
      }

      const store = await storage.getStore();

      // Generate PDF with both signatures
      const signatureInfoData: SignatureInfo = {
        storeSigned: true,
        storeSignedAt: contract.createdAt || new Date(),
        customerSigned: true,
        customerSignedAt: signedSignature.signedAt || new Date(),
        customerName: contract.customer?.name || "Cliente",
        customerDocument: contract.customer?.cpfCnpj?.length === 11 
          ? `CPF: ${formatCPF(contract.customer?.cpfCnpj)}` 
          : `CNPJ: ${formatCNPJ(contract.customer?.cpfCnpj)}`,
        customerIp: signedSignature.signedIp || "N/A",
      };

      const { buffer: pdfBuffer, fileName } = await generateSignedPdfBuffer(contract, store, signatureInfoData);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=assinado_${fileName}`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating signed PDF:", error);
      res.status(500).json({ message: "Erro ao gerar PDF assinado do contrato" });
    }
  });

  // Contract Installments
  app.get("/api/contracts/:contractId/installments", isAuthenticated, async (req, res) => {
    try {
      const contractId = parseInt(req.params.contractId);
      const installments = await storage.getContractInstallments(contractId);
      res.json(installments);
    } catch (error) {
      console.error("Error fetching installments:", error);
      res.status(500).json({ message: "Erro ao buscar parcelas" });
    }
  });

  app.post("/api/contracts/:contractId/installments", isAuthenticated, async (req, res) => {
    try {
      const contractId = parseInt(req.params.contractId);
      const installment = await storage.createContractInstallment({
        ...req.body,
        contractId,
      });
      res.status(201).json(installment);
    } catch (error) {
      console.error("Error creating installment:", error);
      res.status(500).json({ message: "Erro ao criar parcela" });
    }
  });

  app.patch("/api/contracts/installments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const installment = await storage.updateContractInstallment(id, req.body);
      if (!installment) {
        return res.status(404).json({ message: "Parcela não encontrada" });
      }
      res.json(installment);
    } catch (error) {
      console.error("Error updating installment:", error);
      res.status(500).json({ message: "Erro ao atualizar parcela" });
    }
  });

  // Contract Files
  app.get("/api/contracts/:contractId/files", isAuthenticated, async (req, res) => {
    try {
      const contractId = parseInt(req.params.contractId);
      const files = await storage.getContractFiles(contractId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching contract files:", error);
      res.status(500).json({ message: "Erro ao buscar arquivos do contrato" });
    }
  });

  app.post("/api/contracts/:contractId/files", isAuthenticated, async (req, res) => {
    try {
      const contractId = parseInt(req.params.contractId);
      const file = await storage.createContractFile({
        ...req.body,
        contractId,
      });
      res.status(201).json(file);
    } catch (error) {
      console.error("Error creating contract file:", error);
      res.status(500).json({ message: "Erro ao criar arquivo do contrato" });
    }
  });

  // ========== REPORTS & STATISTICS ==========

  // Dashboard statistics
  app.get("/api/reports/dashboard", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Sales by period
  app.get("/api/reports/sales-by-period", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate, groupBy = "day" } = req.query;
      const data = await storage.getSalesByPeriod(
        startDate as string,
        endDate as string,
        groupBy as "day" | "week" | "month"
      );
      res.json(data);
    } catch (error) {
      console.error("Error fetching sales by period:", error);
      res.status(500).json({ message: "Erro ao buscar vendas por período" });
    }
  });

  // Sales by brand
  app.get("/api/reports/sales-by-brand", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await storage.getSalesByBrand(startDate as string, endDate as string);
      res.json(data);
    } catch (error) {
      console.error("Error fetching sales by brand:", error);
      res.status(500).json({ message: "Erro ao buscar vendas por marca" });
    }
  });

  // Sales by category
  app.get("/api/reports/sales-by-category", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await storage.getSalesByCategory(startDate as string, endDate as string);
      res.json(data);
    } catch (error) {
      console.error("Error fetching sales by category:", error);
      res.status(500).json({ message: "Erro ao buscar vendas por categoria" });
    }
  });

  // Sales by seller (admin user who registered the sale)
  app.get("/api/reports/sales-by-seller", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await storage.getSalesBySeller(startDate as string, endDate as string);
      res.json(data);
    } catch (error) {
      console.error("Error fetching sales by seller:", error);
      res.status(500).json({ message: "Erro ao buscar vendas por vendedor" });
    }
  });

  // Profit margin analysis
  app.get("/api/reports/profit-margin", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await storage.getProfitMarginAnalysis(startDate as string, endDate as string);
      res.json(data);
    } catch (error) {
      console.error("Error fetching profit margin:", error);
      res.status(500).json({ message: "Erro ao buscar análise de margem" });
    }
  });

  // ==================== VEHICLE DEBTS (MULTAS/IPVA) ====================
  
  // Get debts for a specific vehicle
  app.get("/api/vehicles/:id/debts", isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const debts = await storage.getVehicleDebts(vehicleId);
      res.json(debts);
    } catch (error) {
      console.error("Error fetching vehicle debts:", error);
      res.status(500).json({ message: "Erro ao buscar débitos do veículo" });
    }
  });

  // Consult debts from external API (or mock)
  app.post("/api/vehicles/:id/debts/consult", isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      if (!vehicle.plate || !vehicle.renavam) {
        return res.status(400).json({ message: "Veículo precisa ter placa e renavam cadastrados para consulta" });
      }

      // For now, generate mock/demo data since we don't have a real API key
      // In production, this would call Celcoin, Asteroide, or another API
      const debts = await storage.consultVehicleDebts(vehicleId, vehicle.plate, vehicle.renavam);
      res.json(debts);
    } catch (error) {
      console.error("Error consulting vehicle debts:", error);
      res.status(500).json({ message: "Erro ao consultar débitos do veículo" });
    }
  });

  // Mark debt as paid
  app.patch("/api/vehicle-debts/:id/pay", isAuthenticated, async (req, res) => {
    try {
      const debtId = parseInt(req.params.id);
      const updatedDebt = await storage.markDebtAsPaid(debtId);
      if (!updatedDebt) {
        return res.status(404).json({ message: "Débito não encontrado" });
      }
      res.json(updatedDebt);
    } catch (error) {
      console.error("Error marking debt as paid:", error);
      res.status(500).json({ message: "Erro ao marcar débito como pago" });
    }
  });

  // Delete a debt record
  app.delete("/api/vehicle-debts/:id", isAuthenticated, async (req, res) => {
    try {
      const debtId = parseInt(req.params.id);
      await storage.deleteVehicleDebt(debtId);
      res.json({ message: "Débito removido com sucesso" });
    } catch (error) {
      console.error("Error deleting vehicle debt:", error);
      res.status(500).json({ message: "Erro ao remover débito" });
    }
  });

  // Get all debts summary (for dashboard)
  app.get("/api/vehicle-debts/summary", isAuthenticated, async (req, res) => {
    try {
      const summary = await storage.getDebtsSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching debts summary:", error);
      res.status(500).json({ message: "Erro ao buscar resumo de débitos" });
    }
  });

  // ========== Contract Signature Public Routes ==========

  // Send signature request email for a contract
  app.post("/api/contracts/:id/send-signature", isAuthenticated, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }

      const customerEmail = contract.customer.email;
      if (!customerEmail) {
        return res.status(400).json({ message: "Cliente não possui email cadastrado" });
      }

      // Check if customer has valid CPF/CNPJ for validation
      const cpfCnpj = contract.customer.cpfCnpj?.replace(/\D/g, "") || "";
      if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
        return res.status(400).json({ message: "CPF/CNPJ do cliente inválido ou não cadastrado" });
      }

      // Get store info for PDF generation
      const store = await storage.getStore();
      if (!store) {
        return res.status(400).json({ message: "Configurações da loja não encontradas" });
      }

      // Create a file record pointing to the dynamic PDF endpoint (with store signature pre-applied)
      const fileName = `contrato_${contract.id}_${Date.now()}.pdf`;
      const fileUrl = `/api/public/contracts/${contract.id}/pdf`;
      
      // Save PDF file record
      await storage.createContractFile({
        contractId: contract.id,
        fileUrl,
        fileName,
        version: 1,
        generatedBy: "signature_request",
      });

      // Invalidate any existing pending signatures for this contract
      await storage.invalidateContractSignatures(contractId);

      // Generate unique token
      const token = crypto.randomBytes(32).toString("hex");
      const tokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      // Create signature record
      await storage.createContractSignature({
        contractId,
        token,
        tokenExpiresAt,
        status: "pending",
        validationAttempts: 0,
        customerEmail,
      });

      // Send email
      const emailSent = await sendSignatureEmail(contract, token, customerEmail);
      
      if (emailSent) {
        // Update contract status
        await storage.updateContract(contractId, { status: "generated" });
        console.log(`Signature email sent to ${customerEmail} for contract #${contractId}`);
        res.json({ message: "Email de assinatura enviado com sucesso", emailSent: true });
      } else {
        // Email not configured but signature record created
        const baseUrl = process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : process.env.BASE_URL || "http://localhost:5000";
        const signatureUrl = `${baseUrl}/assinar/${token}`;
        
        res.json({ 
          message: "Link de assinatura gerado. Email não configurado.", 
          emailSent: false,
          signatureUrl 
        });
      }
    } catch (error) {
      console.error("Error sending signature email:", error);
      res.status(500).json({ message: "Erro ao enviar email de assinatura" });
    }
  });

  // Get signature status for a contract
  app.get("/api/contracts/:id/signature", isAuthenticated, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const signature = await storage.getContractSignature(contractId);
      
      if (!signature) {
        return res.json({ hasSignature: false });
      }

      res.json({
        hasSignature: true,
        status: signature.status,
        signedAt: signature.signedAt,
        validatedAt: signature.validatedAt,
        emailSentAt: signature.emailSentAt,
      });
    } catch (error) {
      console.error("Error getting signature status:", error);
      res.status(500).json({ message: "Erro ao buscar status da assinatura" });
    }
  });

  // Public route: Serve contract PDF for signature (with store signature pre-applied)
  app.get("/api/public/contracts/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }

      const store = await storage.getStore();
      if (!store) {
        return res.status(400).json({ message: "Configurações da loja não encontradas" });
      }

      // Generate PDF with store signature pre-applied
      const signatureInfoData: SignatureInfo = {
        storeSigned: true,
        storeSignedAt: new Date(),
        storeSignedBy: store.representanteLegal || store.nomeFantasia || undefined,
        customerSigned: false,
      };

      const { buffer: pdfBuffer, fileName } = await generateSignedPdfBuffer(contract, store, signatureInfoData);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=${fileName}`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating public PDF:", error);
      res.status(500).json({ message: "Erro ao gerar PDF do contrato" });
    }
  });

  // Public route: Get contract info by token (for signature page)
  app.get("/api/public/signature/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const signature = await storage.getContractSignatureByToken(token);

      if (!signature) {
        return res.status(404).json({ message: "Link inválido ou expirado" });
      }

      if (signature.status === "invalidated") {
        return res.status(410).json({ message: "Link inválido. Um novo link foi gerado." });
      }

      if (new Date() > new Date(signature.tokenExpiresAt)) {
        return res.status(410).json({ message: "Link expirado. Solicite um novo link." });
      }

      const contract = await storage.getContract(signature.contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }

      // Return limited info until validated
      res.json({
        status: signature.status,
        isValidated: signature.status === "validated" || signature.status === "signed",
        isSigned: signature.status === "signed",
        contractId: contract.id,
        contractType: contract.contractType,
        customerName: contract.customer.name,
        vehicleInfo: `${contract.vehicle.brand.name} ${contract.vehicle.model} ${contract.vehicle.year}`,
        cpfCnpjLength: contract.customer.cpfCnpj?.replace(/\D/g, "").length || 0,
      });
    } catch (error) {
      console.error("Error fetching signature info:", error);
      res.status(500).json({ message: "Erro ao buscar informações" });
    }
  });

  // Public route: Validate customer identity
  app.post("/api/public/signature/:token/validate", async (req, res) => {
    try {
      const { token } = req.params;
      const { code } = req.body;
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";

      const signature = await storage.getContractSignatureByToken(token);

      if (!signature) {
        return res.status(404).json({ message: "Link inválido" });
      }

      if (signature.status === "invalidated") {
        return res.status(410).json({ message: "Link inválido. Um novo link foi gerado." });
      }

      if (new Date() > new Date(signature.tokenExpiresAt)) {
        return res.status(410).json({ message: "Link expirado" });
      }

      if (signature.status === "signed") {
        return res.status(400).json({ message: "Contrato já assinado" });
      }

      if (signature.validationAttempts >= 5) {
        return res.status(429).json({ message: "Muitas tentativas. Link bloqueado." });
      }

      const contract = await storage.getContract(signature.contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }

      const cpfCnpj = contract.customer.cpfCnpj?.replace(/\D/g, "") || "";
      let isValid = false;

      // CPF: check last 3 digits, CNPJ: check first 3 digits
      if (cpfCnpj.length === 11) {
        // CPF - last 3 digits
        isValid = cpfCnpj.slice(-3) === code;
      } else if (cpfCnpj.length === 14) {
        // CNPJ - first 3 digits
        isValid = cpfCnpj.slice(0, 3) === code;
      }

      if (!isValid) {
        await storage.incrementValidationAttempts(signature.id);
        const remaining = 5 - (signature.validationAttempts + 1);
        return res.status(400).json({ 
          message: `Código inválido. ${remaining} tentativas restantes.`,
          remaining
        });
      }

      // Mark as validated
      await storage.updateContractSignature(signature.id, {
        status: "validated",
        validatedAt: new Date(),
        validatedIp: clientIp,
      });

      res.json({ message: "Identidade validada com sucesso", validated: true });
    } catch (error) {
      console.error("Error validating signature:", error);
      res.status(500).json({ message: "Erro ao validar identidade" });
    }
  });

  // Public route: Get full contract data after validation
  app.get("/api/public/signature/:token/contract", async (req, res) => {
    try {
      const { token } = req.params;
      const signature = await storage.getContractSignatureByToken(token);

      if (!signature) {
        return res.status(404).json({ message: "Link inválido" });
      }

      if (signature.status === "invalidated") {
        return res.status(410).json({ message: "Link inválido. Um novo link foi gerado." });
      }

      if (signature.status !== "validated" && signature.status !== "signed") {
        return res.status(403).json({ message: "Validação pendente" });
      }

      const contract = await storage.getContract(signature.contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }

      const store = await storage.getStore();
      const files = await storage.getContractFiles(contract.id);

      res.json({
        contract,
        store,
        files,
        isSigned: signature.status === "signed",
        signedAt: signature.signedAt,
      });
    } catch (error) {
      console.error("Error fetching contract for signature:", error);
      res.status(500).json({ message: "Erro ao buscar contrato" });
    }
  });

  // Public route: Sign the contract
  app.post("/api/public/signature/:token/sign", async (req, res) => {
    try {
      const { token } = req.params;
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";

      const signature = await storage.getContractSignatureByToken(token);

      if (!signature) {
        return res.status(404).json({ message: "Link inválido" });
      }

      if (signature.status === "invalidated") {
        return res.status(410).json({ message: "Link inválido. Um novo link foi gerado." });
      }

      if (signature.status === "signed") {
        return res.status(400).json({ message: "Contrato já assinado" });
      }

      if (signature.status !== "validated") {
        return res.status(403).json({ message: "Validação pendente" });
      }

      const signedAt = new Date();

      // Update signature record
      await storage.updateContractSignature(signature.id, {
        status: "signed",
        signedAt,
        signedIp: clientIp,
      });

      // Update contract status
      await storage.updateContract(signature.contractId, { status: "signed" });

      // Get contract data for PDF regeneration
      const contract = await storage.getContract(signature.contractId);
      const store = await storage.getStore();

      let pdfGenerated = false;
      let emailSent = false;

      if (contract && contract.customer) {
        // Generate signed PDF with both signatures
        const signatureInfoData: SignatureInfo = {
          storeSigned: true,
          storeSignedAt: contract.createdAt || new Date(),
          customerSigned: true,
          customerSignedAt: signedAt,
          customerName: contract.customer.name,
          customerDocument: contract.customer.cpfCnpj?.length === 11 
            ? `CPF: ${formatCPF(contract.customer.cpfCnpj)}` 
            : `CNPJ: ${formatCNPJ(contract.customer.cpfCnpj)}`,
          customerIp: clientIp,
        };

        try {
          const { buffer: pdfBuffer, fileName } = await generateSignedPdfBuffer(contract, store, signatureInfoData);
          pdfGenerated = true;

          // Save the signed PDF record with valid API URL for retrieval
          await storage.createContractFile({
            contractId: contract.id,
            fileUrl: `/api/contracts/${contract.id}/pdf/signed`,
            fileName: `contrato_assinado_${contract.id}.pdf`,
            version: 2,
            generatedBy: "digital_signature",
          });

          // Send signed contract email to customer
          if (contract.customer.email) {
            emailSent = await sendSignedContractEmail(
              contract,
              contract.customer.email,
              pdfBuffer,
              fileName
            );
          }
        } catch (pdfError) {
          console.error("Error generating signed PDF:", pdfError);
        }
      }

      // Return appropriate response based on success/failure
      if (!pdfGenerated) {
        return res.status(207).json({ 
          message: "Contrato assinado, porém houve falha ao gerar o PDF assinado. Tente novamente.", 
          signed: true,
          pdfGenerated: false,
          emailSent: false,
          partialSuccess: true,
        });
      }

      if (!emailSent && contract?.customer?.email) {
        return res.status(207).json({ 
          message: "Contrato assinado com sucesso, porém houve falha ao enviar o email. O PDF assinado está disponível para download.", 
          signed: true,
          pdfGenerated: true,
          emailSent: false,
          partialSuccess: true,
        });
      }

      res.json({ 
        message: "Contrato assinado com sucesso!", 
        signed: true,
        pdfGenerated,
        emailSent: emailSent || !contract?.customer?.email,
      });
    } catch (error) {
      console.error("Error signing contract:", error);
      res.status(500).json({ message: "Erro ao assinar contrato" });
    }
  });

  // Check if email is configured
  app.get("/api/email-status", isAuthenticated, async (req, res) => {
    res.json({ configured: isEmailConfigured() });
  });

  return httpServer;
}
