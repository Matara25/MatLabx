import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  PlayIcon,
  BookOpenIcon,
  ChartBarIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

const HomePage = () => {
  const { data: stats, isLoading: statsLoading } = useQuery(
    'home-stats',
    async () => {
      // Mock data - in real app this would come from API
      return {
        totalLabs: 150,
        activeUsers: 2847,
        completedExercises: 15234,
        successRate: 94.5
      }
    }
  )

  const { data: featuredLabs, isLoading: labsLoading } = useQuery(
    'featured-labs',
    async () => {
      // Mock data - in real app this would come from API
      return [
        {
          id: '1',
          title: 'Advanced BGP Configuration',
          description: 'Master BGP routing protocols in enterprise networks',
          category: 'routing',
          difficulty: 'advanced',
          duration: 120,
          rating: 4.8,
          students: 342
        },
        {
          id: '2',
          title: 'VLAN Design & Implementation',
          description: 'Learn to design and implement VLANs for network segmentation',
          category: 'switching',
          difficulty: 'intermediate',
          duration: 90,
          rating: 4.6,
          students: 256
        },
        {
          id: '3',
          title: 'Network Security Fundamentals',
          description: 'Essential security concepts and implementation techniques',
          category: 'security',
          difficulty: 'beginner',
          duration: 60,
          rating: 4.9,
          students: 518
        }
      ]
    }
  )

  const features = [
    {
      icon: PlayIcon,
      title: 'Interactive Labs',
      description: 'Hands-on experience with real network devices and scenarios',
      color: 'primary'
    },
    {
      icon: BookOpenIcon,
      title: 'Comprehensive Curriculum',
      description: 'From basic concepts to advanced enterprise networking',
      color: 'secondary'
    },
    {
      icon: ChartBarIcon,
      title: 'Real-time Feedback',
      description: 'Instant validation and intelligent hint system',
      color: 'accent'
    },
    {
      icon: UserGroupIcon,
      title: 'Collaborative Learning',
      description: 'Work together with peers in shared lab environments',
      color: 'success'
    }
  ]

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-success-400'
      case 'intermediate': return 'text-warning-400'
      case 'advanced': return 'text-error-400'
      default: return 'text-dark-muted'
    }
  }

  const getDifficultyBg = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success-100/20 border-success-200'
      case 'intermediate': return 'bg-warning-100/20 border-warning-200'
      case 'advanced': return 'bg-error-100/20 border-error-200'
      default: return 'bg-dark-card border-dark-border'
    }
  }

  if (statsLoading || labsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-secondary-900 to-accent-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Master Network Engineering
              <span className="block text-2xl sm:text-3xl lg:text-4xl text-primary-300 mt-2">
                Through Interactive Simulation
              </span>
            </h1>
            <p className="text-xl text-primary-200 mb-8 max-w-3xl mx-auto">
              Gain hands-on experience with real network devices, troubleshooting scenarios, and industry-standard protocols.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/labs"
                className="btn-primary text-lg px-8 py-4"
              >
                Explore Labs
              </Link>
              <Link
                to="/auth"
                className="btn-secondary text-lg px-8 py-4"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-dark-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-dark-text mb-4">
              Trusted by Network Professionals Worldwide
            </h2>
            <p className="text-lg text-dark-muted max-w-2xl mx-auto">
              Join thousands of students and professionals advancing their networking skills
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-dark-card p-6 rounded-xl border border-dark-border text-center">
              <div className="text-4xl font-bold text-primary-400 mb-2">
                {stats?.totalLabs?.toLocaleString() || '150+'}
              </div>
              <div className="text-sm text-dark-muted">Interactive Labs</div>
            </div>
            <div className="bg-dark-card p-6 rounded-xl border border-dark-border text-center">
              <div className="text-4xl font-bold text-secondary-400 mb-2">
                {stats?.activeUsers?.toLocaleString() || '2,800+'}
              </div>
              <div className="text-sm text-dark-muted">Active Learners</div>
            </div>
            <div className="bg-dark-card p-6 rounded-xl border border-dark-border text-center">
              <div className="text-4xl font-bold text-accent-400 mb-2">
                {stats?.completedExercises?.toLocaleString() || '15,000+'}
              </div>
              <div className="text-sm text-dark-muted">Completed Exercises</div>
            </div>
            <div className="bg-dark-card p-6 rounded-xl border border-dark-border text-center">
              <div className="text-4xl font-bold text-success-400 mb-2">
                {stats?.successRate || '94.5'}%
              </div>
              <div className="text-sm text-dark-muted">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-dark-text mb-4">
              Why Choose NetLabX?
            </h2>
            <p className="text-lg text-dark-muted max-w-2xl mx-auto">
              Experience the most comprehensive network training platform with cutting-edge features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const isCurriculum = feature.title === 'Comprehensive Curriculum'
              return (
                <div key={index} className={`bg-dark-surface p-8 rounded-xl border border-dark-border hover:border-primary-500/50 transition-all duration-300 hover:scale-105 ${isCurriculum ? 'cursor-pointer' : ''}`}>
                  {isCurriculum ? (
                    <Link to="/curriculum" className="block">
                      <div className={`w-16 h-16 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center mb-6`}>
                        <Icon className={`w-8 h-8 text-${feature.color}-400`} />
                      </div>
                      <h3 className="text-xl font-semibold text-dark-text mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-dark-muted leading-relaxed">
                        {feature.description}
                      </p>
                    </Link>
                  ) : (
                    <>
                      <div className={`w-16 h-16 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center mb-6`}>
                        <Icon className={`w-8 h-8 text-${feature.color}-400`} />
                      </div>
                      <h3 className="text-xl font-semibold text-dark-text mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-dark-muted leading-relaxed">
                        {feature.description}
                      </p>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Labs Section */}
      <section className="py-20 bg-dark-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-dark-text">
              Featured Labs
            </h2>
            <Link
              to="/labs"
              className="flex items-center text-primary-400 hover:text-primary-300 font-medium transition-colors duration-200"
            >
              View All Labs
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredLabs.map((lab) => (
              <div key={lab.id} className="bg-dark-card p-6 rounded-xl border border-dark-border hover:border-primary-500/50 transition-all duration-300 hover:scale-105">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getDifficultyBg(lab.difficulty)}`}>
                    {lab.difficulty.charAt(0).toUpperCase() + lab.difficulty.slice(1)}
                  </span>
                  <div className="flex items-center">
                    <SparklesIcon className="w-4 h-4 text-warning-400 mr-1" />
                    <span className="text-sm text-warning-400 font-medium">
                      {lab.rating}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-dark-text mb-2">
                  {lab.title}
                </h3>
                
                <p className="text-dark-muted text-sm mb-4 line-clamp-2">
                  {lab.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-dark-muted">
                  <span>{lab.duration} minutes</span>
                  <span>{lab.students} students</span>
                </div>
                
                <Link
                  to={`/labs/${lab.id}`}
                  className="mt-4 w-full btn-secondary text-center"
                >
                  Start Lab
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-900 to-secondary-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Advance Your Networking Skills?
          </h2>
          <p className="text-xl text-primary-200 mb-8">
            Join thousands of professionals mastering network engineering through hands-on practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/labs"
              className="btn-primary text-lg px-8 py-4 bg-white text-primary-600 hover:bg-gray-100"
            >
              Browse All Labs
            </Link>
            <Link
              to="/auth"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-all duration-300"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
