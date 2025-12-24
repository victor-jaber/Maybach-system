export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function formatCPFCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return formatCPF(value);
  }
  return formatCNPJ(value);
}

export function cleanCPFCNPJ(value: string): string {
  return value.replace(/\D/g, "");
}

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;
  
  return true;
}

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(digits[12])) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(digits[13])) return false;
  
  return true;
}

export function validateCPFCNPJ(value: string): { valid: boolean; type: "cpf" | "cnpj" | null; message?: string } {
  const digits = value.replace(/\D/g, "");
  
  if (digits.length === 0) {
    return { valid: true, type: null };
  }
  
  if (digits.length <= 11) {
    if (digits.length < 11) {
      return { valid: false, type: "cpf", message: "CPF incompleto" };
    }
    if (!validateCPF(digits)) {
      return { valid: false, type: "cpf", message: "CPF inválido" };
    }
    return { valid: true, type: "cpf" };
  }
  
  if (digits.length < 14) {
    return { valid: false, type: "cnpj", message: "CNPJ incompleto" };
  }
  
  if (!validateCNPJ(digits)) {
    return { valid: false, type: "cnpj", message: "CNPJ inválido" };
  }
  
  return { valid: true, type: "cnpj" };
}

export function formatRG(value: string): string {
  const chars = value.replace(/[^0-9Xx]/gi, "").slice(0, 9).toUpperCase();
  if (chars.length <= 2) return chars;
  if (chars.length <= 5) return `${chars.slice(0, 2)}.${chars.slice(2)}`;
  if (chars.length <= 8) return `${chars.slice(0, 2)}.${chars.slice(2, 5)}.${chars.slice(5)}`;
  return `${chars.slice(0, 2)}.${chars.slice(2, 5)}.${chars.slice(5, 8)}-${chars.slice(8)}`;
}

export function cleanRG(value: string): string {
  return value.replace(/[^0-9Xx]/gi, "").toUpperCase();
}

export function validateRG(value: string): boolean {
  const chars = value.replace(/[^0-9Xx]/gi, "");
  return chars.length >= 7 && chars.length <= 9;
}

export function formatCNH(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function validateCNH(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  
  if (digits.length < 9 || digits.length > 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  
  return true;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function cleanPhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function validatePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function cleanCEP(value: string): string {
  return value.replace(/\D/g, "");
}

export function validateCEP(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 8;
}

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchAddressByCEP(cep: string): Promise<ViaCepResponse | null> {
  const cleanedCep = cep.replace(/\D/g, "");
  
  if (cleanedCep.length !== 8) {
    return null;
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

export function validateAge(birthDate: Date | string, minAge: number = 18): boolean {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  
  if (isNaN(birth.getTime())) {
    return false;
  }
  
  const today = new Date();
  const minDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  
  return birth <= minDate;
}

export function calculateAge(birthDate: Date | string): number {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  
  if (isNaN(birth.getTime())) {
    return 0;
  }
  
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}
