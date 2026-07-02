import React from 'react'
import Hero from '../../components/student/Hero'
import Companies from '../../components/student/Companies'
import CoursesSection from '../../components/student/CoursesSection'
import TestimonialsSection from '../../components/student/TestimonialsSection'
import CallToAction from '../../components/student/CallToAction'
import Footer from '../../components/student/Footer'

const Home = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <Companies />
      <CoursesSection />
      <TestimonialsSection />
      <CallToAction />
      <Footer />
    </main>
  )
}

export default Home
