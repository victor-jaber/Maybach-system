import { useState, useCallback } from "react";
import { fetchAddressByCEP, type ViaCepResponse } from "@/lib/br-formatters";
import { useToast } from "@/hooks/use-toast";

interface UseViaCepReturn {
  loading: boolean;
  error: string | null;
  lookupCEP: (cep: string) => Promise<ViaCepResponse | null>;
}

export function useViaCep(): UseViaCepReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const lookupCEP = useCallback(async (cep: string): Promise<ViaCepResponse | null> => {
    const cleanedCep = cep.replace(/\D/g, "");
    
    if (cleanedCep.length !== 8) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchAddressByCEP(cleanedCep);
      
      if (!data) {
        setError("CEP não encontrado");
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado ou preencha o endereço manualmente.",
          variant: "destructive",
        });
        return null;
      }

      return data;
    } catch {
      setError("Erro ao buscar CEP");
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível consultar o CEP. Preencha o endereço manualmente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { loading, error, lookupCEP };
}
