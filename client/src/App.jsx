import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';
import RecipesPage from './pages/RecipesPage.jsx';
import RecipeDetailPage from './pages/RecipeDetailPage.jsx';
import RecipeFormPage from './pages/RecipeFormPage.jsx';
import IngredientsPage from './pages/IngredientsPage.jsx';
import IngredientDetailPage from './pages/IngredientDetailPage.jsx';
import PantryPage from './pages/PantryPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SubstitutesPage from './pages/SubstitutesPage.jsx';
import BackupPage from './pages/BackupPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route path="/recipes" element={<RecipesPage />} />
      <Route
        path="/recipes/new"
        element={
          <ProtectedRoute>
            <RecipeFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipes/:id/edit"
        element={
          <ProtectedRoute>
            <RecipeFormPage />
          </ProtectedRoute>
        }
      />
      <Route path="/recipes/:id" element={<RecipeDetailPage />} />

      <Route path="/ingredients" element={<IngredientsPage />} />
      <Route path="/ingredients/:name" element={<IngredientDetailPage />} />

      <Route path="/pantry" element={<PantryPage />} />
      <Route path="/substitutes" element={<SubstitutesPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/backup" element={<BackupPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
