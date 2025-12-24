import {
  brands,
  categories,
  vehicles,
  vehicleImages,
  customers,
  sales,
  users,
  type Brand,
  type InsertBrand,
  type Category,
  type InsertCategory,
  type Vehicle,
  type InsertVehicle,
  type VehicleWithRelations,
  type VehicleImage,
  type InsertVehicleImage,
  type Customer,
  type InsertCustomer,
  type Sale,
  type InsertSale,
  type SaleWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string | null;
}

export interface IStorage {
  // Brands
  getBrands(): Promise<Brand[]>;
  getBrand(id: number): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: number, brand: Partial<InsertBrand>): Promise<Brand | undefined>;
  deleteBrand(id: number): Promise<boolean>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Vehicles
  getVehicles(): Promise<VehicleWithRelations[]>;
  getVehicle(id: number): Promise<VehicleWithRelations | undefined>;
  getAvailableVehicles(): Promise<VehicleWithRelations[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Sales
  getSales(): Promise<SaleWithRelations[]>;
  getSale(id: number): Promise<SaleWithRelations | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;
  deleteSale(id: number): Promise<boolean>;

  // Admin Users
  getAdminUsers(): Promise<AdminUser[]>;
  updateAdminUser(id: string, data: { name?: string; email?: string; password?: string }): Promise<AdminUser | undefined>;
  deleteAdminUser(id: string): Promise<boolean>;

  // Vehicle Images
  getVehicleImages(vehicleId: number): Promise<VehicleImage[]>;
  addVehicleImage(image: InsertVehicleImage): Promise<VehicleImage>;
  updateVehicleImage(id: number, data: Partial<InsertVehicleImage>): Promise<VehicleImage | undefined>;
  deleteVehicleImage(id: number): Promise<boolean>;
  setVehiclePrimaryImage(vehicleId: number, imageId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Brands
  async getBrands(): Promise<Brand[]> {
    return db.select().from(brands).orderBy(brands.name);
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand;
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [newBrand] = await db.insert(brands).values(brand).returning();
    return newBrand;
  }

  async updateBrand(id: number, brand: Partial<InsertBrand>): Promise<Brand | undefined> {
    const [updated] = await db.update(brands).set(brand).where(eq(brands.id, id)).returning();
    return updated;
  }

  async deleteBrand(id: number): Promise<boolean> {
    const result = await db.delete(brands).where(eq(brands.id, id));
    return true;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  // Vehicles
  async getVehicles(): Promise<VehicleWithRelations[]> {
    const result = await db.query.vehicles.findMany({
      with: {
        brand: true,
        category: true,
        images: true,
      },
      orderBy: [desc(vehicles.createdAt)],
    });
    return result as VehicleWithRelations[];
  }

  async getVehicle(id: number): Promise<VehicleWithRelations | undefined> {
    const result = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, id),
      with: {
        brand: true,
        category: true,
        images: true,
      },
    });
    return result as VehicleWithRelations | undefined;
  }

  async getAvailableVehicles(): Promise<VehicleWithRelations[]> {
    const result = await db.query.vehicles.findMany({
      where: eq(vehicles.status, "available"),
      with: {
        brand: true,
        category: true,
        images: true,
      },
      orderBy: [desc(vehicles.createdAt)],
    });
    return result as VehicleWithRelations[];
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [updated] = await db
      .update(vehicles)
      .set({ ...vehicle, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();
    return updated;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
    return true;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(customers.name);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }

  // Sales
  async getSales(): Promise<SaleWithRelations[]> {
    const result = await db.query.sales.findMany({
      with: {
        customer: true,
        vehicle: {
          with: {
            brand: true,
            category: true,
          },
        },
      },
      orderBy: [desc(sales.saleDate)],
    });
    return result as SaleWithRelations[];
  }

  async getSale(id: number): Promise<SaleWithRelations | undefined> {
    const result = await db.query.sales.findFirst({
      where: eq(sales.id, id),
      with: {
        customer: true,
        vehicle: {
          with: {
            brand: true,
            category: true,
          },
        },
      },
    });
    return result as SaleWithRelations | undefined;
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const [newSale] = await db.insert(sales).values(sale).returning();
    // Update vehicle status to sold
    await db.update(vehicles).set({ status: "sold" }).where(eq(vehicles.id, sale.vehicleId));
    return newSale;
  }

  async deleteSale(id: number): Promise<boolean> {
    const sale = await this.getSale(id);
    if (sale) {
      await db.delete(sales).where(eq(sales.id, id));
      // Mark vehicle as available again
      await db.update(vehicles).set({ status: "available" }).where(eq(vehicles.id, sale.vehicleId));
    }
    return true;
  }

  // Admin Users
  async getAdminUsers(): Promise<AdminUser[]> {
    const result = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).orderBy(users.name);
    
    return result.map(u => ({
      id: u.id,
      email: u.email || "",
      name: u.name || "",
      role: u.role || "admin",
      createdAt: u.createdAt ? u.createdAt.toISOString() : null,
    }));
  }

  async updateAdminUser(id: string, data: { name?: string; email?: string; password?: string }): Promise<AdminUser | undefined> {
    const updateData: { name?: string; email?: string; passwordHash?: string } = {};
    
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }
    
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    
    if (!updated) return undefined;
    
    return {
      id: updated.id,
      email: updated.email || "",
      name: updated.name || "",
      role: updated.role || "admin",
      createdAt: updated.createdAt ? updated.createdAt.toISOString() : null,
    };
  }

  async deleteAdminUser(id: string): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  // Vehicle Images
  async getVehicleImages(vehicleId: number): Promise<VehicleImage[]> {
    return db.select().from(vehicleImages)
      .where(eq(vehicleImages.vehicleId, vehicleId))
      .orderBy(desc(vehicleImages.isPrimary), vehicleImages.order);
  }

  async addVehicleImage(image: InsertVehicleImage): Promise<VehicleImage> {
    const [newImage] = await db.insert(vehicleImages).values(image).returning();
    return newImage;
  }

  async updateVehicleImage(id: number, data: Partial<InsertVehicleImage>): Promise<VehicleImage | undefined> {
    const [updated] = await db.update(vehicleImages)
      .set(data)
      .where(eq(vehicleImages.id, id))
      .returning();
    return updated;
  }

  async deleteVehicleImage(id: number): Promise<boolean> {
    await db.delete(vehicleImages).where(eq(vehicleImages.id, id));
    return true;
  }

  async setVehiclePrimaryImage(vehicleId: number, imageId: number): Promise<void> {
    await db.update(vehicleImages)
      .set({ isPrimary: false })
      .where(eq(vehicleImages.vehicleId, vehicleId));
    await db.update(vehicleImages)
      .set({ isPrimary: true })
      .where(eq(vehicleImages.id, imageId));
  }
}

export const storage = new DatabaseStorage();
