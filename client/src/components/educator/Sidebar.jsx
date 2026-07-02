import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { assets } from '../../assets/assets'

const navItems = [
  {
    label: 'Dashboard',
    icon: assets.home_icon,
    to: '/educator/dashboard',
  },
  {
    label: 'Add Course',
    icon: assets.add_icon,
    to: '/educator/add-course',
  },
  {
    label: 'My Courses',
    icon: assets.my_course_icon,
    to: '/educator/my-courses',
  },
  {
    label: 'Student Enrolled',
    icon: assets.user_icon,
    to: '/educator/student-enrolled',
  },
  {
    label: 'Reports',
    icon: assets.earning_icon,
    to: '/educator/reports',
  },
]

const Sidebar = () => {
  const location = useLocation()
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 py-6 px-2 flex flex-col gap-2">
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-400' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <img src={item.icon} alt={item.label} className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
