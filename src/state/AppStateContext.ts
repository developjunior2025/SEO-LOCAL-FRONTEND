import { createContext } from 'react';
import type { AppStateValue } from './AppStateProvider';

export const AppStateContext = createContext<AppStateValue | null>(null);
