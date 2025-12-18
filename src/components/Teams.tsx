import React, { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, Mail, Trash2, XCircle, AlertCircle, Send, Plus, CheckCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
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

  const sendInviteEmail = async (email: string, inviterName: string) => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/accept-invite?email=${encodeURIComponent(email)}`;
    
    const response = await fetch('/api/email/team-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        inviterName: inviterName || 'A team member',
        teamName: 'Adiology Team',
        inviteLink
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to send email');
    }
    
    return response.json();
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
      const profile = cachedProfileRef.current;
      const inviterName = profile?.full_name || profile?.email || 'A team member';
      
      await sendInviteEmail(inviteEmail.trim(), inviterName);

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
    } catch (err: any) {
      console.error('Invite error:', err);
      setError(err.message || 'Failed to send invitation. Please try again.');
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

  const handleResendInvite = async (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member || member.status !== 'pending') return;

    setIsLoading(true);
    setError(null);
    
    try {
      const profile = cachedProfileRef.current;
      const inviterName = profile?.full_name || profile?.email || 'A team member';
      
      await sendInviteEmail(member.email, inviterName);
      
      setSuccess(`Invitation resent to ${member.email}`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Resend invite error:', err);
      setError(err.message || 'Failed to resend invitation');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7" style={{ color: '#9333ea' }} />
            <span style={{ background: 'linear-gradient(90deg, #9333ea, #c026d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Team Members</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Invite and manage your team
          </p>
        </div>
        <Button
          onClick={() => setIsInviteDialogOpen(true)}
          className="flex items-center gap-2 text-white"
          style={{ background: 'linear-gradient(90deg, #9333ea, #c026d3)' }}
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

      <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
            <Users className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-lg font-semibold" style={{ color: '#1e293b' }}>Your Team:</h2>
        </div>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div 
              key={member.id}
              className="flex items-center justify-between p-4 rounded-xl border"
              style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: member.status === 'active' ? '#dcfce7' : '#fef9c3' }}>
                  {member.status === 'active' ? (
                    <CheckCircle className="h-5 w-5" style={{ color: '#16a34a' }} />
                  ) : (
                    <Clock className="h-5 w-5" style={{ color: '#ca8a04' }} />
                  )}
                </div>
                <div>
                  <p className="font-medium" style={{ color: '#1e293b' }}>{member.name}</p>
                  <p className="text-sm" style={{ color: '#64748b' }}>{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.role !== 'owner' && (
                  <>
                    {member.status === 'pending' && (
                      <button
                        onClick={() => handleResendInvite(member.id)}
                        className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Resend invitation"
                        style={{ color: '#3b82f6' }}
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title={member.status === 'pending' ? 'Cancel invitation' : 'Remove member'}
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {teamMembers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
              <p style={{ color: '#64748b' }}>No team members yet</p>
              <p className="text-sm" style={{ color: '#94a3b8' }}>Click "Invite Team Member" to get started</p>
            </div>
          )}
        </div>
      </div>

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
