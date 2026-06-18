'use client'

import { useState, useEffect } from 'react';
import { Unit, apiService } from '@/lib/api';

export function useSelectedUnit(unitId: string | null) {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [damageClicks, setDamageClicks] = useState(0);
  const [heatClicks, setHeatClicks] = useState(0);

  useEffect(() => {
    if (unitId) {
      fetchUnitDetails(unitId);
    } else {
      setSelectedUnit(null);
      setDamageClicks(0);
      setHeatClicks(0);
    }
  }, [unitId]);

  const fetchUnitDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const foundUnit = await apiService.getUnit(id);
      if (foundUnit) {
        setSelectedUnit(foundUnit);
        setDamageClicks(0);
        setHeatClicks(0);
      } else {
        throw new Error('Unit not found');
      }
    } catch {
      setError('Failed to load unit details');
    } finally {
      setLoading(false);
    }
  };

  const handleDamage = () => {
    if (damageClicks < 17) {
      setDamageClicks(prev => prev + 1);
    }
  };

  const handleRepair = () => {
    if (damageClicks > 0) {
      setDamageClicks(prev => prev - 1);
    }
  };

  const handleHeat = (maxHeatSteps: number) => {
    if (heatClicks < maxHeatSteps - 1) {
      setHeatClicks(prev => prev + 1);
    }
  };

  const handleCooldown = () => {
    if (heatClicks > 0) {
      setHeatClicks(prev => prev - 1);
    }
  };

  return {
    selectedUnit,
    loading,
    error,
    damageClicks,
    handleDamage,
    handleRepair,
    heatClicks,
    handleHeat,
    handleCooldown,
    refetch: () => unitId && fetchUnitDetails(unitId)
  };
}
