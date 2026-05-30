/**
 * FeatureGate Component
 * Controls access to features based on user's subscription tier
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown, Sparkles, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AccessControlService, { SUBSCRIPTION_TIERS, FEATURE_METADATA } from '../../services/accessControlService';

/**
 * FeatureGate - Wraps content that requires subscription access
 * @param {string} featureId - The feature identifier to check
 * @param {React.ReactNode} children - Content to render if access granted
 * @param {React.ReactNode} fallback - Optional custom fallback for locked state
 * @param {boolean} showUpgradePrompt - Whether to show upgrade modal on locked click
 */
const FeatureGate = ({
  featureId,
  children,
  fallback = null,
  showUpgradePrompt = true,
  onAccessDenied = null
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(null); // null = loading
  const [accessInfo, setAccessInfo] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [user, featureId]);

  const checkAccess = async () => {
    if (!user?.email) {
      setHasAccess(false);
      setAccessInfo({ reason: 'Please log in', upgradeRequired: null });
      return;
    }

    const result = await AccessControlService.checkFeatureAccess(user.email, featureId);
    setHasAccess(result.hasAccess);
    setAccessInfo(result);
  };

  const handleLockedClick = () => {
    if (onAccessDenied) {
      onAccessDenied(accessInfo);
    }
    if (showUpgradePrompt) {
      setShowUpgradeModal(true);
    }
  };

  // Loading state
  if (hasAccess === null) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  // Access granted - render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Access denied - render fallback or locked state
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default locked state
  return (
    <>
      <div
        onClick={handleLockedClick}
        className="relative cursor-pointer group"
      >
        {/* Locked overlay */}
        <div className="absolute inset-0 bg-gray-900/60 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 transition-all group-hover:bg-gray-900/70">
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-yellow-500" />
            </div>
            <p className="text-white font-medium text-sm mb-1">
              {FEATURE_METADATA[featureId]?.name || 'Premium Feature'}
            </p>
            <p className="text-gray-300 text-xs">
              Requires {accessInfo?.upgradeRequired || 'Upgrade'}
            </p>
          </div>
        </div>

        {/* Blurred content preview */}
        <div className="filter blur-sm opacity-50 pointer-events-none">
          {children}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          currentTier={accessInfo?.tier || 'FREE'}
          requiredTier={accessInfo?.upgradeRequired}
          featureName={accessInfo?.featureName}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={(tier) => {
            setShowUpgradeModal(false);
            navigate('/dashboard/subscription', { state: { selectedTier: tier } });
          }}
        />
      )}
    </>
  );
};

/**
 * LockedFeatureCard - Display card for locked features in navigation
 */
export const LockedFeatureCard = ({
  featureId,
  icon: Icon,
  name,
  description,
  requiredTier,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className="relative p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-yellow-500/50 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
            {Icon && <Icon className="h-5 w-5 text-gray-400" />}
          </div>
          <div>
            <h4 className="font-medium text-gray-500 dark:text-gray-400">{name}</h4>
            {description && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full flex items-center">
            <Lock className="h-3 w-3 mr-1" />
            {requiredTier}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * UpgradeModal - Modal for subscription upgrade
 */
export const UpgradeModal = ({
  currentTier,
  requiredTier,
  featureName,
  onClose,
  onUpgrade
}) => {
  const upgradeOptions = AccessControlService.getUpgradeOptions(currentTier);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Crown className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Upgrade Required</h2>
              <p className="text-yellow-100 text-sm mt-1">
                Unlock {featureName || 'premium features'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your current plan ({currentTier}) doesn't include this feature.
            Upgrade to access <strong>{featureName}</strong> and more!
          </p>

          {/* Upgrade Options */}
          <div className="space-y-3">
            {upgradeOptions.map((tier) => (
              <div
                key={tier.id}
                onClick={() => onUpgrade(tier.id)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  tier.id === requiredTier
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {tier.name}
                      </h3>
                      {tier.id === requiredTier && (
                        <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-medium rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {tier.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{tier.price}
                    </p>
                    <p className="text-xs text-gray-500">per month</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA - Temporarily hidden */}
          {/* <button
            onClick={() => onUpgrade(requiredTier || 'BASIC')}
            className="w-full mt-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="h-5 w-5" />
            <span>Upgrade Now</span>
            <ArrowRight className="h-5 w-5" />
          </button>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
            Cancel anytime. No hidden fees.
          </p> */}
        </div>
      </div>
    </div>
  );
};

/**
 * SubscriptionBadge - Shows current subscription tier
 */
export const SubscriptionBadge = ({ tier }) => {
  const tierColors = {
    FREE: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    BASIC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PRO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    PREMIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    ENTERPRISE: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tierColors[tier] || tierColors.FREE}`}>
      {tier === 'PREMIUM' || tier === 'ENTERPRISE' ? (
        <Crown className="h-3 w-3 mr-1" />
      ) : null}
      {tier || 'FREE'}
    </span>
  );
};

/**
 * useFeatureAccess - Hook for checking feature access
 */
export const useFeatureAccess = (featureId) => {
  const { user } = useAuth();
  const [access, setAccess] = useState({ loading: true, hasAccess: false, tier: 'FREE' });

  useEffect(() => {
    const check = async () => {
      if (!user?.email) {
        setAccess({ loading: false, hasAccess: false, tier: 'FREE' });
        return;
      }

      const result = await AccessControlService.checkFeatureAccess(user.email, featureId);
      setAccess({
        loading: false,
        hasAccess: result.hasAccess,
        tier: result.tier,
        upgradeRequired: result.upgradeRequired
      });
    };

    check();
  }, [user, featureId]);

  return access;
};

export default FeatureGate;
