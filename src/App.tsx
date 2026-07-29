import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import Layout from './components/Layout';
import CategoriesPage from './pages/CategoriesPage';
import ExpensesPage from './pages/ExpensesPage';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import RecurringExpensesPage from './pages/RecurringExpensesPage';
import TagDetailPage from './pages/TagDetailPage';
import TagsPage from './pages/TagsPage';
import { isAuthenticated } from './api/auth';

function RequireAuth({ children }: { children: ReactElement }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/recurring-expenses" element={<RecurringExpensesPage />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/tags/:id" element={<TagDetailPage />} />
      </Route>
    </Routes>
  );
}
