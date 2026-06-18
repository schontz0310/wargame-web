'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService, ColorMeaning } from '@/lib/api';

interface ColorMapping {
  [key: string]: string; // colorMeaningId -> hexValue
}

// Fallback hardcoded - atualize com os IDs atuais da sua API
const FALLBACK_COLOR_MAPPING: ColorMapping = {
  // Red
  '6724024d-1887-4150-829a-5485229b6f9d': '#ff0000',
  '6a51d7c5-00b2-428c-a60f-3ed7fdd877ca': '#ff0000',
  // Blue  
  '495ad354-768a-4eec-bfe2-cc3e96abdec4': '#00EEFF',
  '175e2f4d-e2d1-4e11-a3f9-6eb5505bcc60': '#00EEFF',
  // Black
  'a104887a-682f-4c20-9e07-4ce87607f72d': '#000000',
  '7c4952e6-0d8d-4d61-b8a3-af2c1cc87791': '#000000',
  // Green
  '26bfaaac-ef6a-469d-807b-2f5d02861275': '#00ff00',
  '67568b06-43a6-4b2a-bd6c-6ca1a128f5b6': '#00ff00',
  // Gray
  '76f01d7b-ca06-421b-b381-29570edbbaf8': '#B4B4B4',
  '6f5b7c23-e721-4a0b-9a1f-f966aba1a749': '#B4B4B4',
  // Purple
  '071000b0-f5f0-4815-93fd-5fac9bf263a9': '#C200C6',
  '023225ca-c455-4f8c-952c-1d1a1ebed381': '#C200C6',
};

export function useColorMeanings() {
  const [colorMeanings, setColorMeanings] = useState<ColorMeaning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca os colorMeanings da API uma única vez
  useEffect(() => {
    let mounted = true;

    const fetchColorMeanings = async () => {
      try {
        setLoading(true);
        const data = await apiService.getColorMeanings();
        if (mounted && data.length > 0) {
          setColorMeanings(data);
          setError(null);
        } else if (mounted) {
          // Se API retornar vazio, usa fallback
          console.log('useColorMeanings: API returned empty, using fallback');
          setError('API returned empty, using fallback colors');
        }
      } catch {
        if (mounted) {
          console.log('useColorMeanings: API error, using fallback');
          setError('Failed to load from API, using fallback colors');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchColorMeanings();

    return () => {
      mounted = false;
    };
  }, []);

  // Cria o mapeamento dinâmico id -> hexCode (API + Fallback)
  const colorMapping: ColorMapping = useMemo(() => {
    const mapping: ColorMapping = { ...FALLBACK_COLOR_MAPPING };
    // Sobrescreve com dados da API se existirem
    colorMeanings.forEach((cm) => {
      mapping[cm.id] = cm.color.hexCode;
    });
    return mapping;
  }, [colorMeanings]);

  // Função para obter a cor pelo ID (substitui getEquipmentColorById)
  const getColorById = useCallback(
    (colorMeaningId?: string): string => {
      if (!colorMeaningId) return '#ffffff';
      return colorMapping[colorMeaningId] || '#ffffff';
    },
    [colorMapping]
  );

  // Função para verificar se o colorMeaningId existe no mapeamento
  const hasColorMeaningId = useCallback(
    (colorMeaningId?: string): boolean => {
      if (!colorMeaningId) return false;
      return colorMeaningId in colorMapping;
    },
    [colorMapping]
  );

  // Função para obter o texto da cor (preto ou branco baseado no contraste)
  const getTextColorForColor = useCallback((hexColor: string): string => {
    // Remove # se existir
    const hex = hexColor.replace('#', '');
    
    // Converte para RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calcula luminosidade (fórmula YIQ)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // Retorna preto para cores claras, branco para cores escuras
    return yiq >= 128 ? '#000000' : '#FFFFFF';
  }, []);

  return {
    colorMeanings,
    colorMapping,
    getColorById,
    hasColorMeaningId,
    getTextColorForColor,
    loading,
    error,
  };
}
