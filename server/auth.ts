import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction, Express } from "express";
import { db } from "./db";
import { users, loginSchema, registerSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "maybach-secret-key-2024";
const JWT_EXPIRES_IN = "7d";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const token = authHeader.substring(7);
  const user = verifyToken(token);
  
  if (!user) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  
  req.user = user;
  next();
}

export function registerAuthRoutes(app: Express) {
  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }
      
      const { email, password } = parsed.data;
      
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (!user) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }
      
      const isValid = await comparePassword(password, user.passwordHash);
      
      if (!isValid) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }
      
      const token = generateToken({
        id: user.id,
        email: user.email!,
        name: user.name,
        role: user.role,
      });
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });
  
  // Register endpoint (admin only - protected)
  app.post("/api/auth/register", isAuthenticated, async (req, res) => {
    try {
      // Only admins can create new users
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Acesso não autorizado" });
      }
      
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.errors });
      }
      
      const { email, password, name } = parsed.data;
      
      // Check if user already exists
      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (existing) {
        return res.status(400).json({ message: "Este email já está cadastrado" });
      }
      
      const passwordHash = await hashPassword(password);
      
      const [newUser] = await db.insert(users).values({
        email,
        passwordHash,
        name,
        role: "admin",
      }).returning();
      
      res.status(201).json({
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });
  
  // Get current user
  app.get("/api/auth/user", isAuthenticated, (req, res) => {
    res.json(req.user);
  });
  
  // Logout (client-side token removal, but endpoint for consistency)
  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logout realizado com sucesso" });
  });
}

// Seed default admin user
export async function seedAdminUser() {
  try {
    const adminEmail = "admin@maybach.com";
    const [existing] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    
    if (!existing) {
      const passwordHash = await hashPassword("admin123");
      await db.insert(users).values({
        email: adminEmail,
        passwordHash,
        name: "Administrador",
        role: "admin",
      });
      console.log("Admin user created: admin@maybach.com / admin123");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}
