import { Response } from 'express';
import crypto from 'crypto';
import { getFertilizerHistory, saveFertilizerHistory } from '../../core/db.ts';
import { AuthenticatedRequest } from '../../core/middleware/auth.ts';

export const recommendFertilizer = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cropType, soilType, n, p, k, location } = req.body;

    if (!cropType || !soilType) {
      return res.status(400).json({ status: 'error', error: 'Crop type and soil type are required' });
    }

    // Rule-based logic
    let fertilizerName = 'NPK 19-19-19 (Balanced)';
    let quantity = '50kg per acre';
    let instructions = 'Apply as a basal dose during sowing or transplanting.';
    let reason = 'Your soil nutrients are balanced. A general NPK fertilizer is recommended for healthy growth.';

    const nVal = Number(n);
    const pVal = Number(p);
    const kVal = Number(k);

    if (!isNaN(nVal) && nVal < 50) {
      fertilizerName = 'Urea (46% Nitrogen)';
      reason = 'Low Nitrogen detected. Urea is recommended to promote vegetative growth and leaf development.';
    } else if (!isNaN(pVal) && pVal < 40) {
      fertilizerName = 'DAP (Diammonium Phosphate)';
      reason = 'Low Phosphorus detected. DAP is recommended for strong root development and early plant growth.';
    } else if (!isNaN(kVal) && kVal < 40) {
      fertilizerName = 'MOP (Muriate of Potash)';
      reason = 'Low Potassium detected. MOP is recommended to improve disease resistance and overall crop quality.';
    }

    const recommendation = {
      id: crypto.randomUUID(),
      userId: req.user.userId,
      cropType,
      soilType,
      n: nVal,
      p: pVal,
      k: kVal,
      location,
      fertilizerName,
      quantity,
      instructions,
      reason,
      timestamp: new Date().toISOString()
    };

    const history = getFertilizerHistory();
    history.push(recommendation);
    saveFertilizerHistory(history);

    res.json({ status: 'ok', ...recommendation });
  } catch (error) {
    console.error('[API] Fertilizer recommendation error:', error);
    res.json({ 
      status: 'ok', 
      fallback: true, 
      message: 'Using default recommendation due to server error',
      fertilizerName: 'NPK 19-19-19 (Balanced)',
      quantity: '50kg per acre',
      instructions: 'Apply as a basal dose.',
      reason: 'Server error occurred. Providing general recommendation.'
    });
  }
};

export const getFertilizerHistoryList = (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = getFertilizerHistory();
    const userHistory = history.filter((item: any) => item.userId === req.user.userId);
    res.json({ 
      status: 'ok', 
      history: userHistory.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) 
    });
  } catch (error) {
    console.error('[API] Fertilizer history error:', error);
    res.json({ status: 'ok', history: [], fallback: true, message: 'Failed to fetch history' });
  }
};
