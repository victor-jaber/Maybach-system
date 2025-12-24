import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerAuthRoutes, isAuthenticated, seedAdminUser } from "./auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import {
  insertBrandSchema,
  insertCategorySchema,
  insertVehicleApiSchema,
  insertCustomerApiSchema,
  insertSaleApiSchema,
} from "@shared/schema";
import { z } from "zod";

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

  // FIPE API Routes
  const FIPE_API_URL = "https://fipe.dev/v1";
  const FIPE_API_KEY = process.env.FIPE_API_KEY;

  app.get("/api/fipe/types", isAuthenticated, async (req, res) => {
    try {
      const response = await fetch(FIPE_API_URL, {
        headers: { "X-Api-Key": FIPE_API_KEY || "" },
      });
      if (!response.ok) {
        return res.status(response.status).json({ message: "Erro ao buscar tipos de veículos" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching FIPE types:", error);
      res.status(500).json({ message: "Erro ao consultar API FIPE" });
    }
  });

  app.get("/api/fipe/brands/:typeId", isAuthenticated, async (req, res) => {
    try {
      const { typeId } = req.params;
      const response = await fetch(`${FIPE_API_URL}/${typeId}`, {
        headers: { "X-Api-Key": FIPE_API_KEY || "" },
      });
      if (!response.ok) {
        return res.status(response.status).json({ message: "Erro ao buscar marcas" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching FIPE brands:", error);
      res.status(500).json({ message: "Erro ao consultar API FIPE" });
    }
  });

  app.get("/api/fipe/models/:typeId/:brandId", isAuthenticated, async (req, res) => {
    try {
      const { typeId, brandId } = req.params;
      const response = await fetch(`${FIPE_API_URL}/${typeId}/${brandId}`, {
        headers: { "X-Api-Key": FIPE_API_KEY || "" },
      });
      if (!response.ok) {
        return res.status(response.status).json({ message: "Erro ao buscar modelos" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching FIPE models:", error);
      res.status(500).json({ message: "Erro ao consultar API FIPE" });
    }
  });

  app.get("/api/fipe/years/:typeId/:brandId/:modelId", isAuthenticated, async (req, res) => {
    try {
      const { typeId, brandId, modelId } = req.params;
      const response = await fetch(`${FIPE_API_URL}/${typeId}/${brandId}/${modelId}`, {
        headers: { "X-Api-Key": FIPE_API_KEY || "" },
      });
      if (!response.ok) {
        return res.status(response.status).json({ message: "Erro ao buscar anos" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching FIPE years:", error);
      res.status(500).json({ message: "Erro ao consultar API FIPE" });
    }
  });

  app.get("/api/fipe/price/:typeId/:brandId/:modelId/:yearId", isAuthenticated, async (req, res) => {
    try {
      const { typeId, brandId, modelId, yearId } = req.params;
      const response = await fetch(`${FIPE_API_URL}/${typeId}/${brandId}/${modelId}/${yearId}`, {
        headers: { "X-Api-Key": FIPE_API_KEY || "" },
      });
      if (!response.ok) {
        return res.status(response.status).json({ message: "Erro ao buscar preço" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching FIPE price:", error);
      res.status(500).json({ message: "Erro ao consultar API FIPE" });
    }
  });

  return httpServer;
}
