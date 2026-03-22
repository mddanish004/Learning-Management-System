import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import CourseCatalogPage from './pages/CourseCatalogPage'
import CourseDetailPage from './pages/CourseDetailPage'
import InstructorDashboardPage from './pages/InstructorDashboardPage'
import InstructorCoursesPage from './pages/InstructorCoursesPage'
import CreateCoursePage from './pages/CreateCoursePage'
import EditCoursePage from './pages/EditCoursePage'
import LessonsManagementPage from './pages/LessonsManagementPage'
import CoursePlayerPage from './pages/CoursePlayerPage'
import CourseProgressPage from './pages/CourseProgressPage'
import QuizPage from './pages/QuizPage'
import LearnerEnrollmentsPage from './pages/LearnerEnrollmentsPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentResultPage from './pages/PaymentResultPage'
import CertificatePage from './pages/CertificatePage'
import CourseResourcesPage from './pages/CourseResourcesPage'
import InstructorAnalyticsPage from './pages/InstructorAnalyticsPage'
import InstructorEnrollmentsPage from './pages/InstructorEnrollmentsPage'
import InstructorResourcesPage from './pages/InstructorResourcesPage'
import AdminToolsPage from './pages/AdminToolsPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/courses" element={<CourseCatalogPage />} />
      <Route path="/courses/:id" element={<CourseDetailPage />} />
      <Route path="/courses/:id/resources" element={<CourseResourcesPage />} />

      <Route path="/learn/courses/:id" element={<ProtectedRoute><CoursePlayerPage /></ProtectedRoute>} />
      <Route path="/progress/:courseId" element={<ProtectedRoute><CourseProgressPage /></ProtectedRoute>} />
      <Route path="/quiz" element={<ProtectedRoute roles={['learner']}><QuizPage /></ProtectedRoute>} />
      <Route path="/my-learning" element={<ProtectedRoute><LearnerEnrollmentsPage /></ProtectedRoute>} />
      <Route path="/checkout/result" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
      <Route path="/checkout/:courseId" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/certificates/:courseId" element={<ProtectedRoute><CertificatePage /></ProtectedRoute>} />

      <Route path="/dashboard/instructor" element={<ProtectedRoute roles={['instructor', 'admin']}><InstructorDashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard/instructor/courses/new" element={<ProtectedRoute roles={['instructor', 'admin']}><CreateCoursePage /></ProtectedRoute>} />
      <Route path="/dashboard/instructor/courses/:id/edit" element={<ProtectedRoute roles={['instructor', 'admin']}><EditCoursePage /></ProtectedRoute>} />
      <Route path="/dashboard/instructor/courses/:id/lessons" element={<ProtectedRoute roles={['instructor', 'admin']}><LessonsManagementPage /></ProtectedRoute>} />
      <Route path="/dashboard/instructor/courses/:id/analytics" element={<ProtectedRoute roles={['instructor', 'admin']}><InstructorAnalyticsPage /></ProtectedRoute>} />
      <Route path="/dashboard/instructor/courses/:id/enrollments" element={<ProtectedRoute roles={['instructor', 'admin']}><InstructorEnrollmentsPage /></ProtectedRoute>} />
      <Route path="/dashboard/instructor/courses/:id/resources" element={<ProtectedRoute roles={['instructor', 'admin']}><InstructorResourcesPage /></ProtectedRoute>} />
      <Route path="/dashboard/instructor/courses" element={<ProtectedRoute roles={['instructor', 'admin']}><InstructorCoursesPage /></ProtectedRoute>} />

      <Route path="/admin/tools" element={<ProtectedRoute roles={['admin']}><AdminToolsPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
