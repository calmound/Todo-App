import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AllPage } from './pages/All/AllPage';
import AnalysisPage from './pages/Analysis/AnalysisPage';
import AbandonedPage from './pages/Abandoned/AbandonedPage';
import { CalendarPage } from './pages/Calendar/CalendarPage';
import { CategoriesPage } from './pages/Categories/CategoriesPage';
import { InboxPage } from './pages/Inbox/InboxPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

const Router = typeof window !== 'undefined' && '__TAURI__' in window ? HashRouter : BrowserRouter;

function App() {
  dayjs.locale('zh-cn');
  return (
    <MantineProvider defaultColorScheme="light">
      <ModalsProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/all" replace />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="all" element={<AllPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="analysis" element={<AnalysisPage />} />
              <Route path="abandoned" element={<AbandonedPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Router>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
