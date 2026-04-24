import React from 'react'
import { useQuery } from 'react-query'
import { 
  ChartBarIcon,
  BookOpenIcon,
  TrophyIcon,
  ClockIcon,
  UserGroupIcon,
  FireIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const DashboardPage = ({ socket }) => {
  const { data: stats, isLoading } = useQuery(
    'dashboard-stats',
    async () => {
      // Mock data - in real app this would come from API
      return {
        totalLabs: 15,
        completedLabs: 12,
        averageScore: 87.5,
        totalTimeSpent: 2840, // minutes
        skills: [
          { skill: 'routing', level: 75 },
          { skill: 'switching', level: 82 },
          { skill: 'security', level: 68 },
          { skill: 'troubleshooting', level: 91 }
        ],
        recentActivity: [
          { id: 1, type: 'lab-completed', lab: 'BGP Configuration', score: 92, time: '2 hours ago' },
          { id: 2, type: 'lab-started', lab: 'VLAN Design', time: '1 day ago' },
          { id: 3, type: 'achievement', achievement: 'Lab Expert', time: '2 days ago' },
          { id: 4, type: 'lab-completed', lab: 'Network Security', score: 88, time: '3 days ago' }
        ],
        weeklyProgress: [
          { day: 'Mon', labs: 2, score: 85 },
          { day: 'Tue', labs: 1, score: 78 },
          { day: 'Wed', labs: 3, score: 91 },
          { day: 'Thu', labs: 0, score: 0 },
          { day: 'Fri', labs: 1, score: 88 },
          { day: 'Sat', labs: 2, score: 82 },
          { day: 'Sun', labs: 1, score: 95 }
        ]
      }
    }
  )

  const { data: achievements, isLoading: achievementsLoading } = useQuery(
    'achievements',
    async () => {
      // Mock data - in real app this would come from API
      return [
        { id: 1, title: 'First Steps', description: 'Complete your first lab', icon: '🎯', earned: true, earnedDate: '2024-01-15' },
        { id: 2, title: 'Lab Novice', description: 'Complete 5 labs', icon: '⭐', earned: true, earnedDate: '2024-01-20' },
        { id: 3, title: 'Perfect Score', description: 'Get 100% on any lab', icon: '💯', earned: false, progress: 85 },
        { id: 4, title: 'Routing Master', description: 'Complete 10 routing labs', icon: '🌐', earned: false, progress: 60 },
        { id: 5, title: 'Troubleshooting Guru', description: 'Complete 10 troubleshooting labs', icon: '🔧', earned: false, progress: 30 }
      ]
    }
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-dark-text">
            Learning Dashboard
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Overview */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Stats */}
              <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                <div className="flex items-center mb-4">
                  <BookOpenIcon className="w-8 h-8 text-primary-400 mr-3" />
                  <h2 className="text-xl font-semibold text-dark-text">Learning Progress</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-dark-muted">Total Labs</span>
                    <span className="text-2xl font-bold text-primary-400">{stats?.totalLabs || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-dark-muted">Completed</span>
                    <span className="text-2xl font-bold text-success-400">{stats?.completedLabs || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-dark-muted">Average Score</span>
                    <span className="text-2xl font-bold text-warning-400">{stats?.averageScore || 0}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-dark-muted">Total Time</span>
                    <span className="text-2xl font-bold text-accent-400">
                      {Math.floor((stats?.totalTimeSpent || 0) / 60)}h {(stats?.totalTimeSpent || 0) % 60}m
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills Progress */}
              <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                <div className="flex items-center mb-4">
                  <TrophyIcon className="w-8 h-8 text-warning-400 mr-3" />
                  <h2 className="text-xl font-semibold text-dark-text">Skill Development</h2>
                </div>
                
                <div className="space-y-4">
                  {stats?.skills?.map((skill, index) => (
                    <div key={skill.skill} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-dark-muted capitalize">{skill.skill}</span>
                        <span className="text-sm font-semibold text-dark-text">{skill.level}%</span>
                      </div>
                      
                      <div className="w-full bg-dark-border rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-primary transition-all duration-500 ease-out"
                          style={{ width: `${skill.level}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly Progress Chart */}
            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
              <div className="flex items-center mb-4">
                <ChartBarIcon className="w-8 h-8 text-secondary-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text">Weekly Progress</h2>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats?.weeklyProgress || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#6b7280" 
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    tick={{ fill: '#6b7280' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f293b', 
                      border: 'none' 
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-8">
            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
              <div className="flex items-center mb-4">
                <ClockIcon className="w-8 h-8 text-accent-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text">Recent Activity</h2>
              </div>
              
              <div className="space-y-3">
                {stats?.recentActivity?.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-dark-card rounded-lg border border-dark-border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        activity.type === 'lab-completed' ? 'bg-success-100 text-success-800' :
                        activity.type === 'lab-started' ? 'bg-primary-100 text-primary-800' :
                        'bg-warning-100 text-warning-800'
                      }`}>
                        {activity.type === 'lab-completed' ? '✓' :
                         activity.type === 'lab-started' ? '▶' : '🏆'}
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-dark-text">{activity.lab}</div>
                        <div className="text-xs text-dark-muted">{activity.time}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {activity.score && (
                        <div className="text-sm font-semibold text-dark-text">{activity.score}%</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
              <div className="flex items-center mb-4">
                <TrophyIcon className="w-8 h-8 text-warning-400 mr-3" />
                <h2 className="text-xl font-semibold text-dark-text">Achievements</h2>
              </div>
              
              <div className="space-y-4">
                {achievements?.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                      achievement.earned 
                        ? 'bg-success-100 border-success-200' 
                        : 'bg-dark-card border-dark-border opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <div className="text-sm font-semibold text-dark-text">{achievement.title}</div>
                        <div className="text-xs text-dark-muted">{achievement.description}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {achievement.earned ? (
                        <div className="text-xs text-success-600 font-medium">Earned</div>
                      ) : (
                        <div>
                          <div className="text-xs text-dark-muted">{achievement.progress}%</div>
                          <div className="w-12 bg-dark-border rounded-full h-1.5 mt-1">
                            <div 
                              className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                              style={{ width: `${achievement.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
