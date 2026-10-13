import { useLocation } from 'react-router-dom';
import { useMonitoring } from './useMonitoring';
import { getAnalysis } from '../utils/analysis';

export function useAnalysis() {
  const { snapshot, period } = useMonitoring();
  const { search } = useLocation();
  return getAnalysis(snapshot, period, search);
}
