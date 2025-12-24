import type { Express } from "express";
import { createServer, type Server } from "http";
import PDFDocument from "pdfkit";
import { storage } from "./storage";
import { registerAuthRoutes, isAuthenticated, seedAdminUser } from "./auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { getEntryComplementContract, getPurchaseSaleContract, type ContractData } from "./contract-templates";
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
      };

      let contractText = "";
      if (contract.contractType === "entry_complement") {
        contractText = getEntryComplementContract(contractData);
      } else {
        contractText = getPurchaseSaleContract(contractData);
      }

      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=contrato_${id}.pdf`);
        res.send(pdfBuffer);
      });

      const lines = contractText.trim().split("\n");
      for (const line of lines) {
        if (line.trim() === "") {
          doc.moveDown(0.5);
        } else if (line.match(/^CLÁUSULA|^CONTRATO PARTICULAR/)) {
          doc.fontSize(11).font("Helvetica-Bold").text(line.trim(), { align: "left" });
          doc.font("Helvetica").fontSize(10);
        } else if (line.match(/^\d+\.\d+\./)) {
          doc.fontSize(10).font("Helvetica").text(line.trim(), { align: "justify", indent: 0 });
        } else if (line.trim().startsWith("a)") || line.trim().startsWith("b)") || line.trim().startsWith("c)") || line.trim().startsWith("d)") || line.trim().startsWith("e)")) {
          doc.fontSize(10).font("Helvetica").text(line.trim(), { align: "left", indent: 20 });
        } else if (line.includes("_____")) {
          doc.moveDown(1);
          doc.fontSize(10).font("Helvetica").text(line.trim(), { align: "center" });
        } else if (line.trim().startsWith("VENDEDORA:") || line.trim().startsWith("COMPRADOR")) {
          doc.fontSize(10).font("Helvetica-Bold").text(line.trim(), { align: "left" });
          doc.font("Helvetica");
        } else if (line.trim().startsWith("TESTEMUNHAS:")) {
          doc.moveDown(1);
          doc.fontSize(10).font("Helvetica-Bold").text(line.trim(), { align: "left" });
          doc.font("Helvetica");
        } else {
          doc.fontSize(10).font("Helvetica").text(line.trim(), { align: "justify" });
        }
      }

      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Erro ao gerar PDF do contrato" });
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

  return httpServer;
}
