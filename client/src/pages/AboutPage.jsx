import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function AboutPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <h1 className="font-heading font-bold text-3xl md:text-4xl mb-6">About us</h1>
        <p className="text-gray-700 leading-relaxed">
          Penta Academy is an open learning platform where instructors publish courses and learners
          study at their own pace with video lessons, progress tracking, and quizzes.
        </p>
      </main>
      <Footer />
    </div>
  )
}

export default AboutPage
