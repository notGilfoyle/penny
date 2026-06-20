import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { Debts } from './pages/Debts'
import { DebtDetail } from './pages/DebtDetail'
import { Recurring } from './pages/Recurring'
import { Categories } from './pages/Categories'
import { Reports } from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="debts" element={<Debts />} />
          <Route path="debts/:id" element={<DebtDetail />} />
          <Route path="recurring" element={<Recurring />} />
          <Route path="categories" element={<Categories />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
