import { Link } from 'react-router-dom'
import { BookOpen, Code, BarChart3, Palette, Cpu, Server } from 'lucide-react'

const ACCENT_COLORS = [
  'bg-sunshine',
  'bg-mint',
  'bg-blush',
  'bg-skyblue',
  'bg-lavender',
  'bg-peach',
]

const CARD_ICONS = [Code, BarChart3, Palette, Cpu, BookOpen, Server]

function CourseCard({ course, index }) {
  const colorClass = ACCENT_COLORS[index % ACCENT_COLORS.length]
  const IconComponent = CARD_ICONS[index % CARD_ICONS.length]

  return (
    <div className="bg-white border-2 border-black shadow-brutal rounded-xl overflow-hidden hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 flex flex-col">
      <div className={`${colorClass} border-b-2 border-black p-8 flex items-center justify-center`}>
        <IconComponent className="w-12 h-12" strokeWidth={1.5} />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          {course.is_free ? (
            <span className="bg-mint border-2 border-black px-2.5 py-0.5 text-xs font-bold rounded-md">
              FREE
            </span>
          ) : (
            <span className="bg-sunshine border-2 border-black px-2.5 py-0.5 text-xs font-bold rounded-md">
              ${course.price}
            </span>
          )}
        </div>
        <h3 className="font-heading font-bold text-lg mb-1 leading-snug">{course.title}</h3>
        <p className="text-sm text-gray-500 mb-2">by {course.instructor.name}</p>
        <p className="text-sm text-gray-600 mb-5 line-clamp-2 flex-1">{course.description}</p>
        <Link
          to={`/courses/${course.id}`}
          className="font-heading font-bold text-center px-4 py-2.5 bg-white border-2 border-black rounded-lg shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 block"
        >
          View Course →
        </Link>
      </div>
    </div>
  )
}

export default CourseCard
