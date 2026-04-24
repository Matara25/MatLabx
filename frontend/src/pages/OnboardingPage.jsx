import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  AcademicCapIcon, 
  CheckCircleIcon, 
  ArrowRightIcon,
  SparklesIcon,
  BookOpenIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedSkills, setSelectedSkills] = useState([])
  const [selectedGoals, setSelectedGoals] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { user, getToken, updateUser } = useAuth()

  const skills = [
    { id: 'routing', name: 'Routing Protocols', icon: 'Network', description: 'OSPF, EIGRP, BGP configuration' },
    { id: 'switching', name: 'Switching', icon: 'Switch', description: 'VLANs, STP, EtherChannel' },
    { id: 'security', name: 'Network Security', icon: 'Shield', description: 'Firewalls, VPNs, ACLs' },
    { id: 'wireless', name: 'Wireless', icon: 'WiFi', description: 'WLAN, WLC, security' },
    { id: 'automation', name: 'Network Automation', icon: 'Code', description: 'Python, Ansible, APIs' },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: 'Tools', description: 'Debugging, diagnostics' }
  ]

  const goals = [
    { id: 'certification', name: 'Get Certified', description: 'CCNA, CCNP, Network+' },
    { id: 'career', name: 'Career Advancement', description: 'Network Engineer, Architect' },
    { id: 'skills', name: 'Learn New Skills', description: 'Expand technical knowledge' },
    { id: 'practice', name: 'Hands-on Practice', description: 'Real-world scenarios' }
  ]

  const steps = [
    { title: 'Welcome', description: 'Let\'s personalize your learning experience' },
    { title: 'Select Your Skills', description: 'Choose areas you want to focus on' },
    { title: 'Set Your Goals', description: 'What do you want to achieve?' },
    { title: 'Complete', description: 'You\'re ready to start learning!' }
  ]

  const handleSkillToggle = (skillId) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    )
  }

  const handleGoalToggle = (goalId) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    )
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleCompleteOnboarding()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          skills: selectedSkills,
          goals: selectedGoals
        })
      })

      if (response.ok) {
        toast.success('Onboarding completed! Welcome to MatLabx!')
        
        // Update user state through AuthContext
        updateUser({
          hasCompletedOnboarding: true,
          skills: selectedSkills,
          goals: selectedGoals
        })
        
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      } else {
        throw new Error('Failed to complete onboarding')
      }
    } catch (error) {
      toast.error('Failed to complete onboarding')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
              <SparklesIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark-text mb-2">
                Welcome to MatLabx, {user?.profile?.firstName || 'User'}!
              </h2>
              <p className="text-dark-muted">
                Let's personalize your learning experience to help you achieve your networking goals.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                <BookOpenIcon className="w-6 h-6 text-primary-400 mb-2" />
                <h3 className="font-semibold text-dark-text">Hands-on Labs</h3>
                <p className="text-dark-muted">Real network simulations</p>
              </div>
              <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                <LightBulbIcon className="w-6 h-6 text-primary-400 mb-2" />
                <h3 className="font-semibold text-dark-text">Expert Guidance</h3>
                <p className="text-dark-muted">Step-by-step learning</p>
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-dark-text mb-2">Select Your Skills</h2>
              <p className="text-dark-muted">Choose the networking areas you want to focus on</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map(skill => (
                <div
                  key={skill.id}
                  onClick={() => handleSkillToggle(skill.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedSkills.includes(skill.id)
                      ? 'border-primary-400 bg-primary-400/10'
                      : 'border-dark-border bg-dark-card hover:border-dark-border'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedSkills.includes(skill.id)
                        ? 'border-primary-400 bg-primary-400'
                        : 'border-dark-border'
                    }`}>
                      {selectedSkills.includes(skill.id) && (
                        <CheckCircleIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-text">{skill.name}</h3>
                      <p className="text-sm text-dark-muted">{skill.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-dark-text mb-2">Set Your Goals</h2>
              <p className="text-dark-muted">What do you want to achieve with MatLabx?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map(goal => (
                <div
                  key={goal.id}
                  onClick={() => handleGoalToggle(goal.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedGoals.includes(goal.id)
                      ? 'border-primary-400 bg-primary-400/10'
                      : 'border-dark-border bg-dark-card hover:border-dark-border'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedGoals.includes(goal.id)
                        ? 'border-primary-400 bg-primary-400'
                        : 'border-dark-border'
                    }`}>
                      {selectedGoals.includes(goal.id) && (
                        <CheckCircleIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-text">{goal.name}</h3>
                      <p className="text-sm text-dark-muted">{goal.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <AcademicCapIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark-text mb-2">You're All Set!</h2>
              <p className="text-dark-muted mb-4">
                Your personalized learning experience is ready. Let's start your networking journey!
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedSkills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-primary-400/20 text-primary-400 rounded-full text-sm">
                    {skills.find(s => s.id === skill)?.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="bg-dark-surface border border-dark-border rounded-xl shadow-2xl max-w-2xl w-full p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-primary-400 text-white'
                    : 'bg-dark-card text-dark-muted border border-dark-border'
                }`}>
                  {index < currentStep ? (
                    <CheckCircleIcon className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-full h-0.5 mx-4 ${
                    index < currentStep ? 'bg-primary-400' : 'bg-dark-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-dark-text">{steps[currentStep].title}</h3>
            <p className="text-sm text-dark-muted">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-2 text-dark-muted hover:text-primary-400 transition-colors duration-200 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Completing...' : currentStep === steps.length - 1 ? 'Start Learning' : 'Next'}
            <ArrowRightIcon className="w-4 h-4 ml-2 inline" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage
