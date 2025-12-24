import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Marcas de veículos
export const brands = pgTable("brands", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const brandsRelations = relations(brands, ({ many }) => ({
  vehicles: many(vehicles),
}));

export const insertBrandSchema = createInsertSchema(brands).omit({ id: true, createdAt: true });
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brands.$inferSelect;

// Categorias de veículos
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  vehicles: many(vehicles),
}));

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Veículos
export const vehicles = pgTable("vehicles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  brandId: integer("brand_id").notNull().references(() => brands.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  model: varchar("model", { length: 100 }).notNull(),
  year: integer("year").notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  mileage: integer("mileage").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  renavam: varchar("renavam", { length: 11 }),
  plate: varchar("plate", { length: 8 }),
  chassis: varchar("chassis", { length: 17 }),
  fuel: varchar("fuel", { length: 30 }),
  transmission: varchar("transmission", { length: 30 }),
  doors: integer("doors"),
  description: text("description"),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 20 }).notNull().default("available"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  brand: one(brands, { fields: [vehicles.brandId], references: [brands.id] }),
  category: one(categories, { fields: [vehicles.categoryId], references: [categories.id] }),
  sales: many(sales),
  images: many(vehicleImages),
}));

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true, updatedAt: true });

// API schema that accepts strings and coerces to proper types
export const insertVehicleApiSchema = z.object({
  brandId: z.coerce.number(),
  categoryId: z.coerce.number(),
  model: z.string().min(1),
  year: z.coerce.number(),
  color: z.string().min(1),
  mileage: z.coerce.number(),
  price: z.string(),
  renavam: z.string().optional().nullable(),
  plate: z.string().optional().nullable(),
  chassis: z.string().optional().nullable(),
  fuel: z.string().optional().nullable(),
  transmission: z.string().optional().nullable(),
  doors: z.coerce.number().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  status: z.string().default("available"),
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// Clientes
export const customers = pgTable("customers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 200 }).notNull(),
  cpfCnpj: varchar("cpf_cnpj", { length: 18 }).notNull().unique(),
  rg: varchar("rg", { length: 20 }),
  cnh: varchar("cnh", { length: 20 }),
  birthDate: timestamp("birth_date"),
  profession: varchar("profession", { length: 100 }),
  monthlyIncome: decimal("monthly_income", { precision: 12, scale: 2 }),
  email: varchar("email", { length: 150 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  secondaryPhone: varchar("secondary_phone", { length: 20 }),
  cep: varchar("cep", { length: 10 }),
  street: varchar("street", { length: 200 }),
  number: varchar("number", { length: 20 }),
  complement: varchar("complement", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
}));

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });

// API schema that accepts strings and coerces to proper types
export const insertCustomerApiSchema = z.object({
  name: z.string().min(1),
  cpfCnpj: z.string().min(11),
  rg: z.string().optional().nullable(),
  cnh: z.string().optional().nullable(),
  birthDate: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  profession: z.string().optional().nullable(),
  monthlyIncome: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().min(1),
  secondaryPhone: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Vendas
export const sales = pgTable("sales", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  saleDate: timestamp("sale_date").notNull().defaultNow(),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }).notNull(),
  paymentType: varchar("payment_type", { length: 20 }).notNull(),
  downPayment: decimal("down_payment", { precision: 12, scale: 2 }),
  financedValue: decimal("financed_value", { precision: 12, scale: 2 }),
  installments: integer("installments"),
  installmentValue: decimal("installment_value", { precision: 12, scale: 2 }),
  financingBank: varchar("financing_bank", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const salesRelations = relations(sales, ({ one }) => ({
  customer: one(customers, { fields: [sales.customerId], references: [customers.id] }),
  vehicle: one(vehicles, { fields: [sales.vehicleId], references: [vehicles.id] }),
}));

export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, createdAt: true });

// API schema that accepts strings and coerces to proper types
export const insertSaleApiSchema = z.object({
  customerId: z.coerce.number(),
  vehicleId: z.coerce.number(),
  saleDate: z.union([z.string(), z.date()]).transform(val => new Date(val)),
  totalValue: z.string(),
  paymentType: z.enum(["cash", "financed", "credit_card"]),
  downPayment: z.string().optional().nullable(),
  financedValue: z.string().optional().nullable(),
  installments: z.coerce.number().optional().nullable(),
  installmentValue: z.string().optional().nullable(),
  financingBank: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;

// Imagens dos veículos
export const vehicleImages = pgTable("vehicle_images", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vehicleImagesRelations = relations(vehicleImages, ({ one }) => ({
  vehicle: one(vehicles, { fields: [vehicleImages.vehicleId], references: [vehicles.id] }),
}));

export const insertVehicleImageSchema = createInsertSchema(vehicleImages).omit({ id: true, createdAt: true });
export type InsertVehicleImage = z.infer<typeof insertVehicleImageSchema>;
export type VehicleImage = typeof vehicleImages.$inferSelect;

// Dados da Loja
export const stores = pgTable("stores", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  razaoSocial: varchar("razao_social", { length: 200 }).notNull(),
  nomeFantasia: varchar("nome_fantasia", { length: 200 }),
  cnpj: varchar("cnpj", { length: 18 }).notNull(),
  inscricaoEstadual: varchar("inscricao_estadual", { length: 20 }),
  email: varchar("email", { length: 150 }),
  phone: varchar("phone", { length: 20 }),
  cep: varchar("cep", { length: 10 }),
  street: varchar("street", { length: 200 }),
  number: varchar("number", { length: 20 }),
  complement: varchar("complement", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  representanteLegal: varchar("representante_legal", { length: 200 }),
  cpfRepresentante: varchar("cpf_representante", { length: 14 }),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

// Contratos
export const contracts = pgTable("contracts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  saleId: integer("sale_id").references(() => sales.id),
  relatedContractId: integer("related_contract_id"),
  contractType: varchar("contract_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  entradaTotal: decimal("entrada_total", { precision: 12, scale: 2 }),
  entradaPaga: decimal("entrada_paga", { precision: 12, scale: 2 }),
  entradaRestante: decimal("entrada_restante", { precision: 12, scale: 2 }),
  formaPagamentoRestante: varchar("forma_pagamento_restante", { length: 30 }),
  dataVencimentoAvista: timestamp("data_vencimento_avista"),
  quantidadeParcelas: integer("quantidade_parcelas"),
  valorParcela: decimal("valor_parcela", { precision: 12, scale: 2 }),
  diaVencimento: integer("dia_vencimento"),
  formaPagamentoParcelas: varchar("forma_pagamento_parcelas", { length: 30 }),
  multaAtraso: decimal("multa_atraso", { precision: 5, scale: 2 }),
  jurosAtraso: decimal("juros_atraso", { precision: 5, scale: 2 }),
  clausulaVencimentoAntecipado: boolean("clausula_vencimento_antecipado").default(false),
  penalidadesAdicionais: text("penalidades_adicionais"),
  observacoes: text("observacoes"),
  valorVenda: decimal("valor_venda", { precision: 12, scale: 2 }),
  valorFinanciado: decimal("valor_financiado", { precision: 12, scale: 2 }),
  bancoFinanciamento: varchar("banco_financiamento", { length: 100 }),
  numeroContratoFinanciamento: varchar("numero_contrato_financiamento", { length: 50 }),
  parcelasFinanciamento: integer("parcelas_financiamento"),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  customer: one(customers, { fields: [contracts.customerId], references: [customers.id] }),
  vehicle: one(vehicles, { fields: [contracts.vehicleId], references: [vehicles.id] }),
  sale: one(sales, { fields: [contracts.saleId], references: [sales.id] }),
  relatedContract: one(contracts, { fields: [contracts.relatedContractId], references: [contracts.id] }),
  installments: many(contractInstallments),
  files: many(contractFiles),
}));

export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true, updatedAt: true });

export const insertContractApiSchema = z.object({
  customerId: z.coerce.number(),
  vehicleId: z.coerce.number(),
  saleId: z.coerce.number().optional().nullable(),
  relatedContractId: z.coerce.number().optional().nullable(),
  contractType: z.enum(["entry_complement", "purchase_sale"]),
  status: z.enum(["draft", "generated", "signed", "cancelled"]).default("draft"),
  entradaTotal: z.string().optional().nullable(),
  entradaPaga: z.string().optional().nullable(),
  entradaRestante: z.string().optional().nullable(),
  formaPagamentoRestante: z.enum(["avista", "parcelado"]).optional().nullable(),
  dataVencimentoAvista: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  quantidadeParcelas: z.coerce.number().optional().nullable(),
  valorParcela: z.string().optional().nullable(),
  diaVencimento: z.coerce.number().optional().nullable(),
  formaPagamentoParcelas: z.enum(["pix", "boleto", "transferencia"]).optional().nullable(),
  multaAtraso: z.string().optional().nullable(),
  jurosAtraso: z.string().optional().nullable(),
  clausulaVencimentoAntecipado: z.boolean().optional().default(false),
  penalidadesAdicionais: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  valorVenda: z.string().optional().nullable(),
  valorFinanciado: z.string().optional().nullable(),
  bancoFinanciamento: z.string().optional().nullable(),
  numeroContratoFinanciamento: z.string().optional().nullable(),
  parcelasFinanciamento: z.coerce.number().optional().nullable(),
  createdBy: z.string().optional().nullable(),
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// Parcelas do Contrato
export const contractInstallments = pgTable("contract_installments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  contractId: integer("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  numeroParcelaId: integer("numero_parcela").notNull(),
  valor: decimal("valor", { precision: 12, scale: 2 }).notNull(),
  dataVencimento: timestamp("data_vencimento").notNull(),
  dataPagamento: timestamp("data_pagamento"),
  valorPago: decimal("valor_pago", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contractInstallmentsRelations = relations(contractInstallments, ({ one }) => ({
  contract: one(contracts, { fields: [contractInstallments.contractId], references: [contracts.id] }),
}));

export const insertContractInstallmentSchema = createInsertSchema(contractInstallments).omit({ id: true, createdAt: true });
export type InsertContractInstallment = z.infer<typeof insertContractInstallmentSchema>;
export type ContractInstallment = typeof contractInstallments.$inferSelect;

// Arquivos de Contrato (PDFs)
export const contractFiles = pgTable("contract_files", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  contractId: integer("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileHash: varchar("file_hash", { length: 64 }),
  version: integer("version").notNull().default(1),
  generatedBy: varchar("generated_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contractFilesRelations = relations(contractFiles, ({ one }) => ({
  contract: one(contracts, { fields: [contractFiles.contractId], references: [contracts.id] }),
}));

export const insertContractFileSchema = createInsertSchema(contractFiles).omit({ id: true, createdAt: true });
export type InsertContractFile = z.infer<typeof insertContractFileSchema>;
export type ContractFile = typeof contractFiles.$inferSelect;

// Extended types with relations
export type VehicleWithRelations = Vehicle & {
  brand: Brand;
  category: Category;
  images?: VehicleImage[];
};

export type SaleWithRelations = Sale & {
  customer: Customer;
  vehicle: VehicleWithRelations;
};

export type ContractWithRelations = Contract & {
  customer: Customer;
  vehicle: VehicleWithRelations;
  sale?: Sale | null;
  relatedContract?: Contract | null;
  installments?: ContractInstallment[];
  files?: ContractFile[];
};
