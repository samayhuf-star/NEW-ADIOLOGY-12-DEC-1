import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Trash2, Crown, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { getCurrentUserProfile } from '../utils/auth';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending';
  joinedAt?: string;
  invitedAt?: string;
}

interface PlanLimits {
  [key: string]: number;
}

const PLAN_TEAM_LIMITS: PlanLimits = {
  'Basic': 2,
  'Basic (Yearly)': 2,
  'Pro': 5,
  'Pro (Yearly)': 5,
  'Lifetime': 3,
  'free': 1,
};

const getTeamLimit = (planName: string): number => {
  return PLAN_TEAM_LIMITS[planName] || 1;
};

export const Teams: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (profile) {
        setCurrentUserEmail(profile.email || '');
        setUserPlan(profile.subscription_tier || 'free');
        
        const savedTeam = localStorage.getItem(`team_members_${profile.id}`);
        if (savedTeam) {
          setTeamMembers(JSON.parse(savedTeam));
        } else {
          setTeamMembers([{
            id: profile.id,
            email: profile.email || '',
            name: profile.full_name || profile.email || 'You',
            role: 'owner',
            status: 'active',
            joinedAt: new Date().toISOString(),
          }]);
        }
      }
    } catch (err) {
      console.error('Error loading team data:', err);
    }
  };

  const saveTeamData = async (members: TeamMember[]) => {
    try {
      const profile = await getCurrentUserProfile();
      if (profile) {
        localStorage.setItem(`team_members_${profile.id}`, JSON.stringify(members));
      }
    } catch (err) {
      console.error('Error saving team data:', err);
    }
  };

  const teamLimit = getTeamLimit(userPlan);
  const currentTeamSize = teamMembers.length;
  const canInviteMore = currentTeamSize < teamLimit;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!inviteEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (teamMembers.some(m => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
      setError('This email is already a team member or has a pending invitation');
      return;
    }

    if (!canInviteMore) {
      setError(`Your ${userPlan} plan allows up to ${teamLimit} team members. Upgrade your plan to add more.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newMember: TeamMember = {
        id: `invite_${Date.now()}`,
        email: inviteEmail.trim(),
        name: inviteEmail.split('@')[0],
        role: inviteRole,
        status: 'pending',
        invitedAt: new Date().toISOString(),
      };

      const updatedMembers = [...teamMembers, newMember];
      setTeamMembers(updatedMembers);
      await saveTeamData(updatedMembers);

      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('member');
      setIsInviteDialogOpen(false);

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError('Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    if (member.role === 'owner') {
      setError('Cannot remove the team owner');
      return;
    }

    try {
      const updatedMembers = teamMembers.filter(m => m.id !== memberId);
      setTeamMembers(updatedMembers);
      await saveTeamData(updatedMembers);
      setSuccess(`${member.email} has been removed from the team`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError('Failed to remove team member');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-7 w-7" />
            Team Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your team members and invitations
          </p>
        </div>
        <Button
          onClick={() => setIsInviteDialogOpen(true)}
          disabled={!canInviteMore}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-200">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {currentTeamSize} of {teamLimit} members ({userPlan} plan)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${currentTeamSize >= teamLimit ? 'bg-red-500' : 'bg-purple-500'}`}
                  style={{ width: `${Math.min((currentTeamSize / teamLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div 
                key={member.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    {member.role === 'owner' ? (
                      <Crown className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                    ) : (
                      <span className="text-purple-600 dark:text-purple-300 font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getRoleBadgeColor(member.role)}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>
                  <Badge className={getStatusBadgeColor(member.status)}>
                    {member.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                    {member.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </Badge>
                  {member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!canInviteMore && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-200">
                  Team limit reached
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Your {userPlan} plan allows up to {teamLimit} team members. 
                  Upgrade to Pro for up to 5 team members.
                </p>
                <Button variant="outline" size="sm" className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-100">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation to add a new member to your team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <Select value={inviteRole} onValueChange={(v: 'admin' | 'member') => setInviteRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member - Can view and create campaigns</SelectItem>
                  <SelectItem value="admin">Admin - Full access except billing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
