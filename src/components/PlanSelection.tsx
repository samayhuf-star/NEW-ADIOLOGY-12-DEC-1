import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Sparkle, Crown, Zap, Rocket } from 'lucide-react';
import { Button } from './ui/button';

const pricingPlans = [
  {
    name: 'Basic',
    price: '$69.99',
    period: 'per month',
    icon: Rocket,
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    features: [
      '25 campaigns per month',
      'AI keyword generation',
      'All campaign structures',
      'CSV export',
      'Email support'
    ],
    buttonStyle: 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300',
    popular: false,
    priceId: 'price_basic_monthly',
    amount: 6999,
    isSubscription: true
  },
  {
    name: 'Pro',
    price: '$129.99',
    period: 'per month',
    icon: Zap,
    color: 'from-purple-500 to-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    features: [
      'Unlimited campaigns',
      'AI keyword generation',
      'All campaign structures',
      'CSV export',
      '24/7 priority support'
    ],
    buttonStyle: 'bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:shadow-xl',
    popular: true,
    priceId: 'price_pro_monthly',
    amount: 12999,
    isSubscription: true
  },
  {
    name: 'Lifetime',
    price: '$99.99',
    period: 'one-time',
    icon: Crown,
    color: 'from-pink-500 to-purple-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    features: [
      'Unlimited campaigns forever',
      'AI keyword generation',
      'All campaign structures',
      'CSV export',
      '24/7 priority support'
    ],
    buttonStyle: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-xl',
    popular: false,
    priceId: 'price_lifetime',
    amount: 9999,
    isSubscription: false
  }
];

interface PlanSelectionProps {
  onSelectPlan: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void;
  onBack?: () => void;
  userName?: string;
}

export const PlanSelection: React.FC<PlanSelectionProps> = ({ 
  onSelectPlan, 
  onBack,
  userName 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800 p-4 md:p-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white/80 hover:text-white hover:bg-white/10 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkle className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {userName ? `Welcome, ${userName}!` : 'Welcome to Adiology!'}
          </h1>
          <p className="text-xl text-indigo-200 mb-2">
            Choose your plan to get started
          </p>
          <p className="text-sm text-indigo-300/80">
            All plans include 14-day money back guarantee
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {pricingPlans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="px-4 py-1 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-full text-xs shadow-lg font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className={`
                  bg-white rounded-2xl p-6 border-2 ${plan.borderColor}
                  ${plan.popular ? 'shadow-2xl scale-105 ring-4 ring-purple-300/50' : 'shadow-lg hover:shadow-xl'}
                  transition-all duration-300 h-full flex flex-col
                `}>
                  <div className={`w-full h-20 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center mb-6 shadow-md`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                    {plan.name}
                  </h3>

                  <div className="text-center mb-2">
                    <span className="text-gray-900 text-3xl font-bold">{plan.price}</span>
                  </div>
                  <div className="text-gray-500 text-sm text-center mb-6">
                    {plan.period}
                  </div>

                  <div className="space-y-3 mb-6 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => onSelectPlan(plan.name, plan.priceId, plan.amount, plan.isSubscription)}
                    className={`w-full py-3 rounded-xl transition-all font-semibold ${plan.buttonStyle}`}
                  >
                    Select {plan.name}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-8 text-sm text-indigo-200"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <span>14-day money back</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span>Secure payments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>Cancel anytime</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
