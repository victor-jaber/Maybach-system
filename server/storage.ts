import {
  brands,
  categories,
  vehicles,
  vehicleImages,
  vehicleDocuments,
  vehicleCosts,
  customers,
  sales,
  users,
  stores,
  contracts,
  contractInstallments,
  contractFiles,
  contractSignatures,
  vehicleDebts,
  type Brand,
  type InsertBrand,
  type Category,
  type InsertCategory,
  type Vehicle,
  type InsertVehicle,
  type VehicleWithRelations,
  type VehicleImage,
  type InsertVehicleImage,
  type VehicleDocument,
  type InsertVehicleDocument,
  type VehicleCost,
  type InsertVehicleCost,
  type Customer,
  type InsertCustomer,
  type Sale,
  type InsertSale,
  type SaleWithRelations,
  type Store,
  type InsertStore,
  type Contract,
  type InsertContract,
  type ContractWithRelations,
  type ContractInstallment,
  type InsertContractInstallment,
  type ContractFile,
  type InsertContractFile,
  type ContractSignature,
  type InsertContractSignature,
  type VehicleDebt,
  type InsertVehicleDebt,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, count, sum } from "drizzle-orm";
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

  // Vehicle Documents
  getVehicleDocuments(vehicleId: number): Promise<VehicleDocument[]>;
  addVehicleDocument(document: InsertVehicleDocument): Promise<VehicleDocument>;
  deleteVehicleDocument(id: number): Promise<boolean>;

  // Vehicle Costs
  getVehicleCosts(vehicleId: number): Promise<VehicleCost[]>;
  addVehicleCost(cost: InsertVehicleCost): Promise<VehicleCost>;
  updateVehicleCost(id: number, data: Partial<InsertVehicleCost>): Promise<VehicleCost | undefined>;
  deleteVehicleCost(id: number): Promise<boolean>;

  // Store
  getStore(): Promise<Store | undefined>;
  createOrUpdateStore(store: InsertStore): Promise<Store>;

  // Contracts
  getContracts(): Promise<ContractWithRelations[]>;
  getContract(id: number): Promise<ContractWithRelations | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: number): Promise<boolean>;

  // Contract Installments
  getContractInstallments(contractId: number): Promise<ContractInstallment[]>;
  createContractInstallment(installment: InsertContractInstallment): Promise<ContractInstallment>;
  updateContractInstallment(id: number, data: Partial<InsertContractInstallment>): Promise<ContractInstallment | undefined>;

  // Contract Files
  getContractFiles(contractId: number): Promise<ContractFile[]>;
  createContractFile(file: InsertContractFile): Promise<ContractFile>;

  // Contract Signatures
  getContractSignature(contractId: number): Promise<ContractSignature | undefined>;
  getContractSignaturesByContractId(contractId: number): Promise<ContractSignature[]>;
  getContractSignatureByToken(token: string): Promise<ContractSignature | undefined>;
  createContractSignature(signature: InsertContractSignature): Promise<ContractSignature>;
  updateContractSignature(id: number, data: Partial<InsertContractSignature>): Promise<ContractSignature | undefined>;
  incrementValidationAttempts(id: number): Promise<void>;
  invalidateContractSignatures(contractId: number): Promise<void>;

  // Reports & Statistics
  getDashboardStats(): Promise<DashboardStats>;
  getSalesByPeriod(startDate: string, endDate: string, groupBy: "day" | "week" | "month"): Promise<SalesByPeriod[]>;
  getSalesByBrand(startDate?: string, endDate?: string): Promise<SalesByBrand[]>;
  getSalesByCategory(startDate?: string, endDate?: string): Promise<SalesByCategory[]>;
  getSalesBySeller(startDate?: string, endDate?: string): Promise<SalesBySeller[]>;
  getProfitMarginAnalysis(startDate?: string, endDate?: string): Promise<ProfitMarginData[]>;
}

// Report Types
export interface DashboardStats {
  totalSalesMonth: number;
  totalRevenueMonth: number;
  averageTicket: number;
  totalVehiclesInStock: number;
  totalCustomers: number;
  salesGrowth: number;
}

export interface SalesByPeriod {
  period: string;
  count: number;
  revenue: number;
}

export interface SalesByBrand {
  brandId: number;
  brandName: string;
  count: number;
  revenue: number;
}

export interface SalesByCategory {
  categoryId: number;
  categoryName: string;
  count: number;
  revenue: number;
}

export interface SalesBySeller {
  sellerId: string;
  sellerName: string;
  count: number;
  revenue: number;
}

export interface ProfitMarginData {
  saleId: number;
  vehicleModel: string;
  brandName: string;
  saleDate: Date;
  salePrice: number;
  purchasePrice: number;
  profit: number;
  marginPercent: number;
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
    // Remove id from the update object to avoid "column id can only be updated to DEFAULT" error
    const { id: _id, ...updateData } = vehicle as any;
    const [updated] = await db
      .update(vehicles)
      .set({ ...updateData, updatedAt: new Date() })
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
        tradeInVehicle: {
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
        tradeInVehicle: {
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
    // If there's a trade-in vehicle, mark it as reserved for evaluation
    if (sale.tradeInVehicleId) {
      await db.update(vehicles).set({ status: "reserved" }).where(eq(vehicles.id, sale.tradeInVehicleId));
    }
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

  // Vehicle Documents
  async getVehicleDocuments(vehicleId: number): Promise<VehicleDocument[]> {
    return db.select().from(vehicleDocuments).where(eq(vehicleDocuments.vehicleId, vehicleId)).orderBy(desc(vehicleDocuments.createdAt));
  }

  async addVehicleDocument(document: InsertVehicleDocument): Promise<VehicleDocument> {
    const [newDocument] = await db.insert(vehicleDocuments).values(document).returning();
    return newDocument;
  }

  async deleteVehicleDocument(id: number): Promise<boolean> {
    await db.delete(vehicleDocuments).where(eq(vehicleDocuments.id, id));
    return true;
  }

  // Vehicle Costs
  async getVehicleCosts(vehicleId: number): Promise<VehicleCost[]> {
    return db.select().from(vehicleCosts).where(eq(vehicleCosts.vehicleId, vehicleId)).orderBy(desc(vehicleCosts.createdAt));
  }

  async addVehicleCost(cost: InsertVehicleCost): Promise<VehicleCost> {
    const [newCost] = await db.insert(vehicleCosts).values(cost).returning();
    return newCost;
  }

  async updateVehicleCost(id: number, data: Partial<InsertVehicleCost>): Promise<VehicleCost | undefined> {
    const [updated] = await db.update(vehicleCosts).set(data).where(eq(vehicleCosts.id, id)).returning();
    return updated;
  }

  async deleteVehicleCost(id: number): Promise<boolean> {
    await db.delete(vehicleCosts).where(eq(vehicleCosts.id, id));
    return true;
  }

  // Store
  async getStore(): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).limit(1);
    return store;
  }

  async createOrUpdateStore(store: InsertStore): Promise<Store> {
    const existing = await this.getStore();
    if (existing) {
      const [updated] = await db.update(stores)
        .set({ ...store, updatedAt: new Date() })
        .where(eq(stores.id, existing.id))
        .returning();
      return updated;
    }
    const [newStore] = await db.insert(stores).values(store).returning();
    return newStore;
  }

  // Contracts
  async getContracts(): Promise<ContractWithRelations[]> {
    const result = await db.query.contracts.findMany({
      with: {
        customer: true,
        vehicle: {
          with: {
            brand: true,
            category: true,
            images: true,
          },
        },
        tradeInVehicle: {
          with: {
            brand: true,
            category: true,
          },
        },
        sale: true,
        installments: true,
        files: true,
      },
      orderBy: [desc(contracts.createdAt)],
    });
    return result as ContractWithRelations[];
  }

  async getContract(id: number): Promise<ContractWithRelations | undefined> {
    const result = await db.query.contracts.findFirst({
      where: eq(contracts.id, id),
      with: {
        customer: true,
        vehicle: {
          with: {
            brand: true,
            category: true,
            images: true,
          },
        },
        tradeInVehicle: {
          with: {
            brand: true,
            category: true,
          },
        },
        sale: true,
        installments: true,
        files: true,
      },
    });
    return result as ContractWithRelations | undefined;
  }

  async getVehicleByPlate(plate: string): Promise<VehicleWithRelations | undefined> {
    const result = await db.query.vehicles.findFirst({
      where: eq(vehicles.plate, plate.toUpperCase().replace(/[^A-Z0-9]/g, '')),
      with: {
        brand: true,
        category: true,
        images: true,
      },
    });
    return result as VehicleWithRelations | undefined;
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db.insert(contracts).values(contract).returning();
    return newContract;
  }

  async updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const [updated] = await db.update(contracts)
      .set({ ...contract, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    return updated;
  }

  async deleteContract(id: number): Promise<boolean> {
    await db.delete(contracts).where(eq(contracts.id, id));
    return true;
  }

  // Contract Installments
  async getContractInstallments(contractId: number): Promise<ContractInstallment[]> {
    return db.select().from(contractInstallments)
      .where(eq(contractInstallments.contractId, contractId))
      .orderBy(contractInstallments.numeroParcelaId);
  }

  async createContractInstallment(installment: InsertContractInstallment): Promise<ContractInstallment> {
    const [newInstallment] = await db.insert(contractInstallments).values(installment).returning();
    return newInstallment;
  }

  async updateContractInstallment(id: number, data: Partial<InsertContractInstallment>): Promise<ContractInstallment | undefined> {
    const [updated] = await db.update(contractInstallments)
      .set(data)
      .where(eq(contractInstallments.id, id))
      .returning();
    return updated;
  }

  // Contract Files
  async getContractFiles(contractId: number): Promise<ContractFile[]> {
    return db.select().from(contractFiles)
      .where(eq(contractFiles.contractId, contractId))
      .orderBy(desc(contractFiles.createdAt));
  }

  async createContractFile(file: InsertContractFile): Promise<ContractFile> {
    const [newFile] = await db.insert(contractFiles).values(file).returning();
    return newFile;
  }

  // Contract Signatures
  async getContractSignature(contractId: number): Promise<ContractSignature | undefined> {
    const [signature] = await db.select().from(contractSignatures)
      .where(eq(contractSignatures.contractId, contractId))
      .orderBy(desc(contractSignatures.createdAt))
      .limit(1);
    return signature;
  }

  async getContractSignaturesByContractId(contractId: number): Promise<ContractSignature[]> {
    return db.select().from(contractSignatures)
      .where(eq(contractSignatures.contractId, contractId))
      .orderBy(desc(contractSignatures.createdAt));
  }

  async getContractSignatureByToken(token: string): Promise<ContractSignature | undefined> {
    const [signature] = await db.select().from(contractSignatures)
      .where(eq(contractSignatures.token, token));
    return signature;
  }

  async createContractSignature(signature: InsertContractSignature): Promise<ContractSignature> {
    const [newSignature] = await db.insert(contractSignatures).values(signature).returning();
    return newSignature;
  }

  async updateContractSignature(id: number, data: Partial<InsertContractSignature>): Promise<ContractSignature | undefined> {
    const [updated] = await db.update(contractSignatures)
      .set(data)
      .where(eq(contractSignatures.id, id))
      .returning();
    return updated;
  }

  async incrementValidationAttempts(id: number): Promise<void> {
    await db.update(contractSignatures)
      .set({ validationAttempts: sql`${contractSignatures.validationAttempts} + 1` })
      .where(eq(contractSignatures.id, id));
  }

  async invalidateContractSignatures(contractId: number): Promise<void> {
    await db.update(contractSignatures)
      .set({ status: "invalidated" })
      .where(and(
        eq(contractSignatures.contractId, contractId),
        eq(contractSignatures.status, "pending")
      ));
  }

  // ========== Reports & Statistics ==========

  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month sales
    const currentMonthSales = await db.select({
      count: count(),
      revenue: sum(sales.totalValue),
    })
      .from(sales)
      .where(gte(sales.saleDate, startOfMonth));

    // Last month sales for growth comparison
    const lastMonthSales = await db.select({
      count: count(),
      revenue: sum(sales.totalValue),
    })
      .from(sales)
      .where(and(
        gte(sales.saleDate, startOfLastMonth),
        lte(sales.saleDate, endOfLastMonth)
      ));

    // Total vehicles in stock
    const vehiclesInStock = await db.select({ count: count() })
      .from(vehicles)
      .where(eq(vehicles.status, "available"));

    // Total customers
    const totalCustomers = await db.select({ count: count() })
      .from(customers);

    const currentCount = Number(currentMonthSales[0]?.count || 0);
    const currentRevenue = Number(currentMonthSales[0]?.revenue || 0);
    const lastCount = Number(lastMonthSales[0]?.count || 0);

    // Calculate growth percentage
    const salesGrowth = lastCount > 0 
      ? ((currentCount - lastCount) / lastCount) * 100 
      : currentCount > 0 ? 100 : 0;

    return {
      totalSalesMonth: currentCount,
      totalRevenueMonth: currentRevenue,
      averageTicket: currentCount > 0 ? currentRevenue / currentCount : 0,
      totalVehiclesInStock: Number(vehiclesInStock[0]?.count || 0),
      totalCustomers: Number(totalCustomers[0]?.count || 0),
      salesGrowth: Math.round(salesGrowth * 100) / 100,
    };
  }

  async getSalesByPeriod(
    startDate: string,
    endDate: string,
    groupBy: "day" | "week" | "month"
  ): Promise<SalesByPeriod[]> {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const end = endDate ? new Date(endDate) : new Date();
    // Set end date to end of day to include all sales on that day
    end.setHours(23, 59, 59, 999);

    let result;
    if (groupBy === "day") {
      result = await db.execute(sql`
        SELECT 
          TO_CHAR(sale_date, 'YYYY-MM-DD') as period,
          COUNT(*)::int as count,
          COALESCE(SUM(total_value), 0)::numeric as revenue
        FROM sales
        WHERE sale_date >= ${start} AND sale_date <= ${end}
        GROUP BY TO_CHAR(sale_date, 'YYYY-MM-DD')
        ORDER BY period ASC
      `);
    } else if (groupBy === "week") {
      result = await db.execute(sql`
        SELECT 
          TO_CHAR(sale_date, 'IYYY-IW') as period,
          COUNT(*)::int as count,
          COALESCE(SUM(total_value), 0)::numeric as revenue
        FROM sales
        WHERE sale_date >= ${start} AND sale_date <= ${end}
        GROUP BY TO_CHAR(sale_date, 'IYYY-IW')
        ORDER BY period ASC
      `);
    } else {
      result = await db.execute(sql`
        SELECT 
          TO_CHAR(sale_date, 'YYYY-MM') as period,
          COUNT(*)::int as count,
          COALESCE(SUM(total_value), 0)::numeric as revenue
        FROM sales
        WHERE sale_date >= ${start} AND sale_date <= ${end}
        GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
        ORDER BY period ASC
      `);
    }

    return (result.rows as any[]).map(row => ({
      period: row.period,
      count: Number(row.count),
      revenue: Number(row.revenue),
    }));
  }

  async getSalesByBrand(startDate?: string, endDate?: string): Promise<SalesByBrand[]> {
    const start = startDate ? new Date(startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const result = await db.execute(sql`
      SELECT 
        b.id as brand_id,
        b.name as brand_name,
        COUNT(s.id)::int as count,
        COALESCE(SUM(s.total_value), 0)::numeric as revenue
      FROM sales s
      INNER JOIN vehicles v ON s.vehicle_id = v.id
      INNER JOIN brands b ON v.brand_id = b.id
      WHERE s.sale_date >= ${start} AND s.sale_date <= ${end}
      GROUP BY b.id, b.name
      ORDER BY count DESC
    `);

    return (result.rows as any[]).map(row => ({
      brandId: Number(row.brand_id),
      brandName: row.brand_name,
      count: Number(row.count),
      revenue: Number(row.revenue),
    }));
  }

  async getSalesByCategory(startDate?: string, endDate?: string): Promise<SalesByCategory[]> {
    const start = startDate ? new Date(startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const result = await db.execute(sql`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(s.id)::int as count,
        COALESCE(SUM(s.total_value), 0)::numeric as revenue
      FROM sales s
      INNER JOIN vehicles v ON s.vehicle_id = v.id
      INNER JOIN categories c ON v.category_id = c.id
      WHERE s.sale_date >= ${start} AND s.sale_date <= ${end}
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `);

    return (result.rows as any[]).map(row => ({
      categoryId: Number(row.category_id),
      categoryName: row.category_name,
      count: Number(row.count),
      revenue: Number(row.revenue),
    }));
  }

  async getSalesBySeller(startDate?: string, endDate?: string): Promise<SalesBySeller[]> {
    // For now, return empty array as we don't have seller tracking on sales
    // This would require adding a seller_id field to sales table
    return [];
  }

  async getProfitMarginAnalysis(startDate?: string, endDate?: string): Promise<ProfitMarginData[]> {
    const start = startDate ? new Date(startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const result = await db.execute(sql`
      SELECT 
        s.id as sale_id,
        v.model as vehicle_model,
        b.name as brand_name,
        s.sale_date,
        s.total_value::numeric as sale_price,
        COALESCE(v.price::numeric, 0) as purchase_price
      FROM sales s
      INNER JOIN vehicles v ON s.vehicle_id = v.id
      INNER JOIN brands b ON v.brand_id = b.id
      WHERE s.sale_date >= ${start} AND s.sale_date <= ${end}
      ORDER BY s.sale_date DESC
    `);

    return (result.rows as any[]).map(row => {
      const salePrice = Number(row.sale_price);
      const purchasePrice = Number(row.purchase_price);
      const profit = salePrice - purchasePrice;
      const marginPercent = purchasePrice > 0 ? (profit / purchasePrice) * 100 : 0;

      return {
        saleId: Number(row.sale_id),
        vehicleModel: row.vehicle_model,
        brandName: row.brand_name,
        saleDate: new Date(row.sale_date),
        salePrice,
        purchasePrice,
        profit,
        marginPercent: Math.round(marginPercent * 100) / 100,
      };
    });
  }

  // ==================== VEHICLE DEBTS ====================

  async getVehicleDebts(vehicleId: number): Promise<VehicleDebt[]> {
    return await db
      .select()
      .from(vehicleDebts)
      .where(eq(vehicleDebts.vehicleId, vehicleId))
      .orderBy(vehicleDebts.dueDate);
  }

  async consultVehicleDebts(vehicleId: number, plate: string, renavam: string): Promise<VehicleDebt[]> {
    // Clear existing debts for fresh consultation
    await db.delete(vehicleDebts).where(eq(vehicleDebts.vehicleId, vehicleId));

    const apiToken = process.env.INFOSIMPLES_API_TOKEN;
    const debtsToInsert: InsertVehicleDebt[] = [];

    // Try InfoSimples API if token is available
    if (apiToken) {
      try {
        const response = await fetch("https://api.infosimples.com/api/v2/consultas/sefaz/sp/debitos-veiculo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            placa: plate,
            renavam: renavam,
            token: apiToken,
          }),
        });

        const data = await response.json();

        if (data.code === 200 && data.data && data.data.length > 0) {
          const vehicleData = data.data[0];

          // Process IPVA debts
          if (vehicleData.ipva && Array.isArray(vehicleData.ipva)) {
            for (const ipva of vehicleData.ipva) {
              if (ipva.saldo_devido && parseFloat(ipva.normalizado_saldo_devido || ipva.saldo_devido) > 0) {
                debtsToInsert.push({
                  vehicleId,
                  debtType: "ipva",
                  description: `IPVA ${ipva.competencia}`,
                  year: parseInt(ipva.competencia) || new Date().getFullYear(),
                  dueDate: null,
                  value: ipva.normalizado_saldo_devido || ipva.saldo_devido?.toString() || "0",
                  status: "pending",
                  reference: ipva.boleto || null,
                  source: "infosimples",
                });
              }
            }
          }

          // Process IPVA não inscritos (pending IPVA)
          if (vehicleData.ipva_nao_inscritos && Array.isArray(vehicleData.ipva_nao_inscritos)) {
            for (const ipva of vehicleData.ipva_nao_inscritos) {
              debtsToInsert.push({
                vehicleId,
                debtType: "ipva",
                description: `IPVA ${ipva.exercicio} (Não Inscrito)`,
                year: parseInt(ipva.exercicio) || new Date().getFullYear(),
                dueDate: null,
                value: ipva.normalizado_valor || ipva.valor?.toString() || "0",
                status: "pending",
                reference: null,
                source: "infosimples",
              });
            }
          }

          // Process Licenciamento debts
          if (vehicleData.licenciamentos && Array.isArray(vehicleData.licenciamentos)) {
            for (const lic of vehicleData.licenciamentos) {
              debtsToInsert.push({
                vehicleId,
                debtType: "licenciamento",
                description: `Licenciamento ${lic.exercicio}`,
                year: parseInt(lic.exercicio) || new Date().getFullYear(),
                dueDate: null,
                value: lic.normalizado_valor || lic.valor?.toString() || "0",
                status: "pending",
                reference: null,
                source: "infosimples",
              });
            }
          }

          // Process Multas
          if (vehicleData.multas && vehicleData.multas.lista && Array.isArray(vehicleData.multas.lista)) {
            for (const multa of vehicleData.multas.lista) {
              debtsToInsert.push({
                vehicleId,
                debtType: "multa",
                description: multa.descricao || "Multa de Trânsito",
                year: new Date().getFullYear(),
                dueDate: multa.data_vencimento ? new Date(multa.data_vencimento) : null,
                value: multa.normalizado_valor || multa.valor?.toString() || "0",
                status: "pending",
                reference: multa.auto_infracao || null,
                source: "infosimples",
              });
            }
          }

          // Process Dívida Ativa
          if (vehicleData.ipva_divida_ativa && Array.isArray(vehicleData.ipva_divida_ativa)) {
            for (const divida of vehicleData.ipva_divida_ativa) {
              debtsToInsert.push({
                vehicleId,
                debtType: "divida_ativa",
                description: `Dívida Ativa IPVA ${divida.exercicio || ""}`,
                year: parseInt(divida.exercicio) || new Date().getFullYear(),
                dueDate: null,
                value: divida.normalizado_valor || divida.valor?.toString() || "0",
                status: "pending",
                reference: null,
                source: "infosimples",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error calling InfoSimples API:", error);
        // Fall back to demo data
      }
    }

    // If no debts found from API or no API token, generate demo data
    if (debtsToInsert.length === 0) {
      const currentYear = new Date().getFullYear();

      debtsToInsert.push({
        vehicleId,
        debtType: "ipva",
        description: `IPVA ${currentYear} - Cota Única`,
        year: currentYear,
        dueDate: new Date(currentYear, 0, 31),
        value: (Math.random() * 3000 + 1500).toFixed(2),
        status: Math.random() > 0.5 ? "pending" : "paid",
        reference: `${renavam}${currentYear}01`,
        source: "demo",
      });

      debtsToInsert.push({
        vehicleId,
        debtType: "licenciamento",
        description: `Licenciamento Anual ${currentYear}`,
        year: currentYear,
        dueDate: new Date(currentYear, 3, 30),
        value: "98.91",
        status: Math.random() > 0.3 ? "pending" : "paid",
        reference: `LIC${plate}${currentYear}`,
        source: "demo",
      });

      if (Math.random() > 0.4) {
        debtsToInsert.push({
          vehicleId,
          debtType: "multa",
          description: "Multa - Excesso de Velocidade",
          year: currentYear,
          dueDate: new Date(currentYear, Math.floor(Math.random() * 11), Math.floor(Math.random() * 28) + 1),
          value: (Math.random() * 400 + 130.16).toFixed(2),
          status: "pending",
          reference: `MUL${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          source: "demo",
        });
      }

      debtsToInsert.push({
        vehicleId,
        debtType: "seguro",
        description: `Seguro Obrigatório ${currentYear}`,
        year: currentYear,
        dueDate: new Date(currentYear, 0, 31),
        value: "16.00",
        status: Math.random() > 0.2 ? "paid" : "pending",
        reference: `SEG${renavam}${currentYear}`,
        source: "demo",
      });
    }

    // Insert all debts
    const insertedDebts: VehicleDebt[] = [];
    for (const debt of debtsToInsert) {
      const [inserted] = await db.insert(vehicleDebts).values(debt).returning();
      insertedDebts.push(inserted);
    }

    return insertedDebts;
  }

  async markDebtAsPaid(debtId: number): Promise<VehicleDebt | null> {
    const [updated] = await db
      .update(vehicleDebts)
      .set({ status: "paid", paymentDate: new Date() })
      .where(eq(vehicleDebts.id, debtId))
      .returning();
    return updated || null;
  }

  async deleteVehicleDebt(debtId: number): Promise<void> {
    await db.delete(vehicleDebts).where(eq(vehicleDebts.id, debtId));
  }

  async getDebtsSummary(): Promise<{
    totalPending: number;
    totalPaid: number;
    byType: { type: string; count: number; total: number }[];
    vehiclesWithDebts: number;
  }> {
    const result = await db.execute(sql`
      SELECT 
        status,
        debt_type,
        COUNT(*)::integer as count,
        COALESCE(SUM(value), 0)::numeric as total,
        COUNT(DISTINCT vehicle_id)::integer as vehicles
      FROM vehicle_debts
      GROUP BY status, debt_type
    `);

    const rows = result.rows as any[];
    let totalPending = 0;
    let totalPaid = 0;
    const byTypeMap = new Map<string, { count: number; total: number }>();
    const vehicleSet = new Set<number>();

    for (const row of rows) {
      const amount = Number(row.total);
      const count = Number(row.count);

      if (row.status === "pending") {
        totalPending += amount;
      } else if (row.status === "paid") {
        totalPaid += amount;
      }

      const existing = byTypeMap.get(row.debt_type) || { count: 0, total: 0 };
      byTypeMap.set(row.debt_type, {
        count: existing.count + count,
        total: existing.total + amount,
      });
    }

    // Get unique vehicles count
    const vehiclesResult = await db.execute(sql`
      SELECT COUNT(DISTINCT vehicle_id)::integer as count FROM vehicle_debts WHERE status = 'pending'
    `);
    const vehiclesWithDebts = Number((vehiclesResult.rows[0] as any)?.count || 0);

    return {
      totalPending,
      totalPaid,
      byType: Array.from(byTypeMap.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        total: data.total,
      })),
      vehiclesWithDebts,
    };
  }
}

export const storage = new DatabaseStorage();
