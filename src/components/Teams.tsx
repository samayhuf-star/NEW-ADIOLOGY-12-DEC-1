import React, { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, Mail, Trash2, Crown, Clock, CheckCircle, XCircle, AlertCircle, Send, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
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

interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  subscription_plan?: string;
}

export const Teams: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const cachedProfileRef = useRef<UserProfile | null>(null);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (profile) {
        cachedProfileRef.current = profile;
        
        const savedTeam = localStorage.getItem(`team_members_${profile.id}`);
        if (savedTeam) {
          setTeamMembers(JSON.parse(savedTeam));
        } else {
          const ownerMember: TeamMember = {
            id: profile.id,
            email: profile.email || '',
            name: profile.full_name || profile.email || 'You',
            role: 'owner',
            status: 'active',
            joinedAt: new Date().toISOString(),
          };
          setTeamMembers([ownerMember]);
          localStorage.setItem(`team_members_${profile.id}`, JSON.stringify([ownerMember]));
        }
      }
    } catch (err) {
      console.error('Error loading team data:', err);
    }
  };

  const saveTeamData = (members: TeamMember[]) => {
    const profile = cachedProfileRef.current;
    if (profile) {
      localStorage.setItem(`team_members_${profile.id}`, JSON.stringify(members));
    }
  };

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
      saveTeamData(updatedMembers);

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

  const handleRemoveMember = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    if (member.role === 'owner') {
      setError('Cannot remove the team owner');
      return;
    }

    const updatedMembers = teamMembers.filter(m => m.id !== memberId);
    setTeamMembers(updatedMembers);
    saveTeamData(updatedMembers);
    
    const action = member.status === 'pending' ? 'cancelled' : 'removed';
    setSuccess(`${member.email} has been ${action}`);
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleResendInvite = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member || member.status !== 'pending') return;

    setSuccess(`Invitation resent to ${member.email}`);
    setTimeout(() => setSuccess(null), 5000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-7 w-7" />
            Team Members
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Invite and manage your team
          </p>
        </div>
        <Button
          onClick={() => setIsInviteDialogOpen(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Invite Team Member
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
        <CardContent className="pt-6">
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
                  {member.status === 'active' ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Accepted
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                  {member.role !== 'owner' && (
                    <div className="flex items-center gap-1">
                      {member.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendInvite(member.id)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Resend invitation"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title={member.status === 'pending' ? 'Cancel invitation' : 'Remove member'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {teamMembers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No team members yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Click "Invite Team Member" to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
              <Select value={inviteRole} onValueChange={(value: 'admin' | 'member') => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;
