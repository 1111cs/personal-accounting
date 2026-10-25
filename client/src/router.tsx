import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout';
import Home from './pages/Home';
import Record from './pages/Record';
import BillList from './pages/BillList';
import BillDetail from './pages/BillDetail';
import Budget from './pages/Budget';
import BudgetDetail from './pages/BudgetDetail';
import ReserveDetail from './pages/ReserveDetail';
import StreakDetail from './pages/StreakDetail';
import Stats from './pages/Stats';
import Achievement from './pages/Achievement';
import PriceRadar from './pages/PriceRadar';
import PriceRecord from './pages/PriceRecord';
import Settings from './pages/Settings';
import Login from './pages/Login';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'bills', element: <BillList /> },
      { path: 'bills/:id', element: <BillDetail /> },
      { path: 'record', element: <Record /> },
      { path: 'record/:id', element: <Record /> },
      { path: 'budget', element: <Budget /> },
      { path: 'budget/detail', element: <BudgetDetail /> },
      { path: 'reserve/detail', element: <ReserveDetail /> },
      { path: 'streak/detail', element: <StreakDetail /> },
      { path: 'stats', element: <Stats /> },
      { path: 'achievements', element: <Achievement /> },
      { path: 'price', element: <PriceRadar /> },
      { path: 'price/record', element: <PriceRecord /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);
