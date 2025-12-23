import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const pricingPlans = [
  {
    name: 'Basic',
    price: '$69.99',
    period: 'per month',
    icon: '🚀',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    features: [
      '10 Active Campaigns',
      '5 Draft Campaigns',
      '50 Campaign Exports/Month',
      '500 Keyword Credits/Month',
      '10 Landing Page Templates',
      '5 Active/Saved Landing Pages',
      '3 Connected Domains',
      '10 Campaign Presets',
      '2 User Seats',
      'Email Support',
      'Raise Tickets'
    ],
    buttonStyle: 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300',
    popular: false
  },
  {
    name: 'Basic (Yearly)',
    price: '$671.90',
    period: 'per year',
    savings: 'Save 20%',
    icon: '🚀',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    features: [
      '10 Active Campaigns',
      '5 Draft Campaigns',
      '50 Campaign Exports/Month',
      '500 Keyword Credits/Month',
      '10 Landing Page Templates',
      '5 Active/Saved Landing Pages',
      '3 Connected Domains',
      '10 Campaign Presets',
      '2 User Seats',
      'Email Support',
      'Raise Tickets'
    ],
    buttonStyle: 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300',
    popular: false
  },
  {
    name: 'Pro',
    price: '$129.99',
    period: 'per month',
    icon: '⚡',
    color: 'from-purple-500 to-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    features: [
      '50 Active Campaigns',
      'Unlimited Draft Campaigns',
      'Unlimited Campaign Exports',
      '2,500 Keyword Credits/Month',
      '50+ Landing Page Templates',
      '50+ Active/Saved Landing Pages',
      '15 Connected Domains',
      '50+ Campaign Presets',
      '5 User Seats',
      'Email Support',
      'Raise Tickets'
    ],
    buttonStyle: 'bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:shadow-xl',
    popular: true
  },
  {
    name: 'Pro (Yearly)',
    price: '$1,247.90',
    period: 'per year',
    savings: 'Save 20%',
    icon: '⚡',
    color: 'from-purple-500 to-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    features: [
      '50 Active Campaigns',
      'Unlimited Draft Campaigns',
      'Unlimited Campaign Exports',
      '2,500 Keyword Credits/Month',
      '50+ Landing Page Templates',
      '50+ Active/Saved Landing Pages',
      '15 Connected Domains',
      '50+ Campaign Presets',
      '5 User Seats',
      'Email Support',
      'Raise Tickets'
    ],
    buttonStyle: 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300',
    popular: false
  },
  {
    name: 'Lifetime',
    price: '$49.99',
    period: 'one-time payment',
    icon: '👑',
    color: 'from-pink-500 to-purple-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    features: [
      '5 campaigns per month',
      '1 team member',
      '10 web templates',
      '20+ campaign presets for all verticals',
      'Geo targeting: Countries',
      '5 custom domains',
      'Keywords mixer & planner',
      'Live ad preview (RSA, DKI, Call-Only)',
      '10+ Google Ads assets & extensions',
      'CSV export to Google Ads',
      'Email support',
      'Chat support'
    ],
    buttonStyle: 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300',
    popular: false
  }
];

interface PricingProps {
  onSelectPlan?: (planName: string, priceId: string, amount: number, isSubscription: boolean) => void;
}

export function Pricing({ onSelectPlan }: PricingProps) {
  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-purple-50/30 to-white w-full">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <h2 className="text-gray-900 mb-4">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Perfect Plan</span>
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            No hidden fees • Cancel anytime • 14-day money back guarantee
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="px-4 py-1 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-full text-xs shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div className={`
                bg-white rounded-2xl p-6 border-2 ${plan.borderColor}
                ${plan.popular ? 'shadow-2xl scale-105 ring-4 ring-purple-100' : 'shadow-lg hover:shadow-xl'}
                transition-all duration-300 h-full flex flex-col
              `}>
                {/* Icon Header */}
                <div className={`w-full h-20 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center mb-6 shadow-md`}>
                  <span className="text-4xl">{plan.icon}</span>
                </div>

                {/* Plan Name */}
                <h3 className="text-gray-900 text-center mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="text-center mb-2">
                  <span className="text-gray-900 text-3xl">{plan.price}</span>
                </div>
                <div className="text-gray-500 text-sm text-center mb-2">
                  {plan.period}
                </div>
                {(plan as any).savings && (
                  <div className="text-center mb-4">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      {(plan as any).savings}
                    </span>
                  </div>
                )}
                {!(plan as any).savings && <div className="mb-4" />}

                {/* Features */}
                <div className="space-y-3 mb-6 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button 
                  onClick={() => {
                    if (onSelectPlan) {
                      // Map plan names to price IDs - these should match your Stripe price IDs
                      const priceIdMap: Record<string, { priceId: string; amount: number; isSubscription: boolean }> = {
                        'Basic': { priceId: 'price_basic_monthly', amount: 6999, isSubscription: true },
                        'Basic (Yearly)': { priceId: 'price_basic_yearly', amount: 67190, isSubscription: true },
                        'Pro': { priceId: 'price_pro_monthly', amount: 12999, isSubscription: true },
                        'Pro (Yearly)': { priceId: 'price_pro_yearly', amount: 124790, isSubscription: true },
                        'Lifetime': { priceId: 'price_lifetime', amount: 4999, isSubscription: false }
                      };
                      const planData = priceIdMap[plan.name] || { priceId: '', amount: 0, isSubscription: false };
                      onSelectPlan(plan.name, planData.priceId, planData.amount, planData.isSubscription);
                    }
                  }}
                  className={`w-full py-3 rounded-xl transition-all ${plan.buttonStyle}`}
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
            <span>14-day money back</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span>Secure payments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span>10k+ happy users</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
