import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Play,
  Brain,
  BarChart3,
  Award,
  UserPlus,
  Search,
  Trophy,
  ArrowRight,
  Check,
  Sparkles,
  Users,
  Star,
  School,
  GraduationCap,
} from 'lucide-react'
import { apiUrl } from '../lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CourseCard from '../components/CourseCard'

const MARQUEE_ITEMS = [
  '🎓 START LEARNING TODAY',
  '🤖 AI-POWERED QUIZZES',
  '📹 VIDEO LESSONS',
  '📊 TRACK YOUR PROGRESS',
  '🏆 EARN CERTIFICATES',
  '👨‍🏫 BECOME AN INSTRUCTOR',
  '🚀 LAUNCH YOUR CAREER',
  '💡 LEARN BY DOING',
]

const FEATURES = [
  {
    icon: Play,
    title: 'Video Lessons',
    description:
      'Learn at your own pace with high-quality video content from expert instructors worldwide.',
    color: 'bg-skyblue',
  },
  {
    icon: Brain,
    title: 'AI-Powered Quizzes',
    description:
      'Test your knowledge with automatically generated quizzes that adapt to your lesson content.',
    color: 'bg-lavender',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description:
      'Monitor your learning journey with detailed progress dashboards and completion metrics.',
    color: 'bg-mint',
  },
  {
    icon: Award,
    title: 'Certificates',
    description:
      'Earn verified certificates upon course completion to showcase your professional skills.',
    color: 'bg-sunshine',
  },
]

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up as a learner or instructor in seconds. Completely free to get started.',
    color: 'bg-coral',
  },
  {
    icon: Search,
    title: 'Browse Courses',
    description: 'Explore our rich catalog across various topics with powerful search and filters.',
    color: 'bg-ocean',
  },
  {
    icon: Play,
    title: 'Start Learning',
    description: 'Watch video lessons, read content, and take AI-generated quizzes at your pace.',
    color: 'bg-sunshine',
  },
  {
    icon: Trophy,
    title: 'Track & Achieve',
    description: 'Monitor your progress, complete courses, and earn certificates of achievement.',
    color: 'bg-mint',
  },
]

const marqueeText = MARQUEE_ITEMS.join('  \u00A0•\u00A0  ') + '  \u00A0•\u00A0  '

function LandingPage() {
  const [featuredCourses, setFeaturedCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch(apiUrl('/api/v1/courses?limit=6&is_published=true&sort_by=created_at&sort_order=desc'))
        if (res.ok) {
          const data = await res.json()
          setFeaturedCourses(data.courses || [])
        }
      } catch {
        setFeaturedCourses([])
      } finally {
        setCoursesLoading(false)
      }
    }
    loadCourses()
  }, [])

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="bg-sunshine border-b-2 border-black py-2.5 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex w-max">
          <span className="font-heading font-bold text-sm">{marqueeText}</span>
          <span className="font-heading font-bold text-sm">{marqueeText}</span>
        </div>
      </div>

      <section className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-sunshine/40 border-2 border-black rounded-full px-4 py-1.5 mb-6 shadow-brutal-sm">
                <Sparkles className="w-4 h-4" />
                <span className="font-heading font-bold text-sm">Open Learning Platform</span>
              </div>
              <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
                Learn Without Limits, Grow Without{' '}
                <span className="bg-coral text-white px-3 py-0.5 border-2 border-black inline-block rotate-[-1deg] shadow-brutal-sm">
                  Boundaries
                </span>
              </h1>
              <p className="text-lg text-gray-700 mb-8 max-w-xl leading-relaxed">
                Master new skills with expert-led video courses, AI-powered quizzes, and
                personalized progress tracking. Whether you&apos;re a learner or an instructor,
                Penta Academy is your launchpad.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/courses"
                  className="font-heading font-bold px-8 py-3.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 flex items-center gap-2 text-lg"
                >
                  Browse Courses <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/auth/register"
                  className="font-heading font-bold px-8 py-3.5 bg-ocean text-white border-2 border-black rounded-xl shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 text-lg"
                >
                  Start Teaching
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-sunshine border-2 border-black rounded-full shadow-brutal-sm" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-blush border-2 border-black rounded-lg rotate-12 shadow-brutal-sm" />

              <div className="relative bg-white border-2 border-black shadow-brutal-lg rounded-2xl p-8 z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-ocean border-2 border-black rounded-xl flex items-center justify-center shadow-brutal-sm">
                    <Play className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-lg">Learn at your pace</p>
                    <p className="text-sm text-gray-500">Structured paths and clear milestones</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-heading font-bold">Your Progress</span>
                    <span className="font-heading font-bold text-coral">75%</span>
                  </div>
                  <div className="h-4 bg-gray-100 border-2 border-black rounded-full overflow-hidden">
                    <div className="h-full bg-mint rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>

                <div className="bg-lavender border-2 border-black rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Brain className="w-5 h-5" />
                    <span className="font-heading font-bold text-sm">AI Quiz Ready</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Questions generated from the material you add
                  </p>
                </div>
              </div>

              <div className="absolute top-4 -left-8 bg-sunshine border-2 border-black rounded-lg px-3 py-1.5 shadow-brutal-sm rotate-[-6deg] z-20">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-heading font-bold text-sm">All in one place</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-charcoal border-y-2 border-black py-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            {
              title: 'Learn anywhere',
              subtitle: 'Access courses whenever it fits your day',
              icon: BookOpen,
            },
            {
              title: 'Learn together',
              subtitle: 'A space for learners and instructors alike',
              icon: Users,
            },
            {
              title: 'Expert-led',
              subtitle: 'Practical lessons from people who teach',
              icon: School,
            },
            {
              title: 'Built for growth',
              subtitle: 'Progress tracking that keeps you moving',
              icon: Star,
            },
          ].map(({ title, subtitle, icon }) => {
            const Icon = icon
            return (
            <div key={title} className="text-center text-white">
              <Icon className="w-7 h-7 mx-auto mb-2 text-sunshine" />
              <p className="font-heading font-bold text-2xl md:text-3xl">{title}</p>
              <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
            </div>
            )
          })}
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">Choose Your Path</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Penta Academy supports two journeys. Pick yours and get started in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-mint border-2 border-black shadow-brutal-md rounded-2xl p-8 hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal-sm transition-all duration-200">
              <div className="w-16 h-16 bg-white border-2 border-black rounded-xl shadow-brutal-sm flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-2xl mb-3">I&apos;m a Learner</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Access thousands of courses, track your progress, take AI-generated quizzes, and
                earn certificates of completion.
              </p>
              <ul className="space-y-3 mb-8">
                {['Video lessons', 'Progress tracking', 'AI quizzes', 'Certificates'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-white border-2 border-black rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </div>
                      <span className="font-medium">{item}</span>
                    </li>
                  ),
                )}
              </ul>
              <Link
                to="/auth/register"
                className="font-heading font-bold px-6 py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
              >
                Start Learning <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="bg-lavender border-2 border-black shadow-brutal-md rounded-2xl p-8 hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal-sm transition-all duration-200">
              <div className="w-16 h-16 bg-white border-2 border-black rounded-xl shadow-brutal-sm flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-2xl mb-3">I&apos;m an Instructor</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Create and publish courses, manage lessons with easy reordering, and reach
                thousands of eager learners globally.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Course builder',
                  'Lesson management',
                  'Analytics dashboard',
                  'Revenue tracking',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white border-2 border-black rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/auth/register"
                className="font-heading font-bold px-6 py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
              >
                Start Teaching <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white border-y-2 border-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
              Why Choose Penta Academy?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Everything you need for an exceptional learning experience, all in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white border-2 border-black shadow-brutal rounded-xl p-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200"
              >
                <div
                  className={`w-14 h-14 ${feature.color} border-2 border-black rounded-xl shadow-brutal-sm flex items-center justify-center mb-5`}
                >
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Get started in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="bg-white border-2 border-black shadow-brutal rounded-xl p-6 text-center h-full">
                  <div className="w-10 h-10 bg-charcoal text-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4 font-heading font-bold text-lg shadow-brutal-sm">
                    {i + 1}
                  </div>
                  <div
                    className={`w-14 h-14 ${step.color} border-2 border-black rounded-xl shadow-brutal-sm flex items-center justify-center mx-auto mb-5`}
                  >
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white border-y-2 border-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">Featured Courses</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Start with these popular picks from our catalog
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {coursesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border-2 border-black rounded-xl overflow-hidden">
                  <div className="bg-gray-100 border-b-2 border-black p-8 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse mt-2" />
                  </div>
                </div>
              ))
            ) : featuredCourses.length > 0 ? (
              featuredCourses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 font-heading font-bold">No courses available yet. Check back soon!</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <Link
              to="/courses"
              className="font-heading font-bold px-8 py-3.5 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 inline-flex items-center gap-2 text-lg"
            >
              View All Courses <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-coral border-y-2 border-black relative overflow-hidden">
        <div className="absolute top-6 left-6 w-20 h-20 bg-white/10 border-2 border-white/20 rounded-full" />
        <div className="absolute bottom-8 right-12 w-32 h-32 bg-white/10 border-2 border-white/20 rounded-lg rotate-12" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of learners and instructors on Penta Academy. Your next skill is just a
            click away.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/auth/register"
              className="font-heading font-bold px-10 py-4 bg-white text-black border-2 border-black rounded-xl shadow-brutal-lg hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all duration-200 inline-flex items-center gap-2 text-lg"
            >
              Get Started Free <ArrowRight className="w-6 h-6" />
            </Link>
            <Link
              to="/courses"
              className="font-heading font-bold px-10 py-4 bg-transparent text-white border-2 border-white rounded-xl hover:bg-white/10 transition-all duration-200 inline-flex items-center gap-2 text-lg"
            >
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage
