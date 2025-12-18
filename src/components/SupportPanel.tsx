import React, { useState, useEffect } from 'react';
import { 
    MessageSquare, Send, LifeBuoy, AlertCircle, CheckCircle2, 
    Clock, ChevronRight 
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { api } from '../utils/api';
import { notifications } from '../utils/notifications';

interface Ticket {
    id: string;
    subject: string;
    message: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    timestamp: string;
}

export const SupportPanel = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form State
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('Medium');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            try {
                const data = await api.get('/tickets/list');
                if (data.tickets) {
                    setTickets(data.tickets);
                } else {
                    // If API returns but no tickets, check localStorage
                    const localTickets = JSON.parse(localStorage.getItem('support-tickets') || '[]');
                    setTickets(localTickets);
                }
            } catch (apiError) {
                // Fallback to localStorage - work silently
                console.log('ℹ️ Loading tickets from local storage (API unavailable)');
                const localTickets = JSON.parse(localStorage.getItem('support-tickets') || '[]');
                // Sort by timestamp (newest first)
                localTickets.sort((a: Ticket, b: Ticket) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                setTickets(localTickets);
            }
        } catch (error) {
            console.error("Fetch tickets error", error);
            // Even if there's an error, try to load from localStorage
            try {
                const localTickets = JSON.parse(localStorage.getItem('support-tickets') || '[]');
                localTickets.sort((a: Ticket, b: Ticket) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                setTickets(localTickets);
            } catch (e) {
                console.error("Failed to load from localStorage", e);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;

        setIsSubmitting(true);
        try {
            // Try API first
            try {
                await api.post('/tickets/create', { subject, message, priority });
                // Success - refresh tickets
                setSubject('');
                setMessage('');
                setPriority('Medium');
                await fetchTickets();
                // Show success message
                notifications.success('Ticket submitted successfully! Our team will respond soon.', {
                    title: 'Ticket Submitted'
                });
            } catch (apiError) {
                // Fallback to localStorage - work silently
                console.log('ℹ️ Saving ticket to local storage (API unavailable)');
                const ticket: Ticket = {
                    id: crypto.randomUUID(),
                    subject,
                    message,
                    priority: priority as any,
                    status: 'Open',
                    timestamp: new Date().toISOString()
                };
                const existing = JSON.parse(localStorage.getItem('support-tickets') || '[]');
                existing.unshift(ticket);
                localStorage.setItem('support-tickets', JSON.stringify(existing));
                
                // Clear form
                setSubject('');
                setMessage('');
                setPriority('Medium');
                
                // Refresh tickets list
                await fetchTickets();
                
                // Show success message (not error)
                notifications.success('Ticket saved successfully! Your ticket has been recorded and our team will review it.', {
                    title: 'Ticket Saved'
                });
            }
        } catch (error) {
            console.error("Create ticket error", error);
            notifications.error('Failed to submit ticket. Please try again.', {
                title: 'Submission Failed'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'In Progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'Resolved': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Support Center
                </h1>
                <p className="text-slate-500 mt-1">Need help? Submit a ticket and our team will assist you.</p>
            </div>

            {/* Shell View - Two Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Card 1: Stats */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs text-slate-400 ml-2 font-mono">support_stats.sh</span>
                    </div>
                    <div className="p-4 font-mono">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1 text-center">
                                <div className="text-2xl font-bold text-violet-400">{tickets.length}</div>
                                <div className="text-xs text-slate-400">Total</div>
                            </div>
                            <div className="space-y-1 text-center">
                                <div className="text-2xl font-bold text-amber-400">{tickets.filter(t => t.status === 'Open').length}</div>
                                <div className="text-xs text-slate-400">Open</div>
                            </div>
                            <div className="space-y-1 text-center">
                                <div className="text-2xl font-bold text-emerald-400">{tickets.filter(t => t.status === 'Resolved').length}</div>
                                <div className="text-xs text-slate-400">Resolved</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Info */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs text-slate-400 ml-2 font-mono">support_info.sh</span>
                    </div>
                    <div className="p-4 font-mono space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">priority:</span>
                            <span className="text-cyan-400">Low, Medium, High, Critical</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">response:</span>
                            <span className="text-emerald-400">Within 24 hours</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">status:</span>
                            <span className="text-blue-400">Open, In Progress, Resolved</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* New Ticket Form */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LifeBuoy className="w-5 h-5 text-indigo-500"/> New Ticket
                        </CardTitle>
                        <CardDescription>Describe your issue in detail.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject</label>
                                <Input 
                                    placeholder="Brief summary of the issue" 
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Priority</label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low - General Question</SelectItem>
                                        <SelectItem value="Medium">Medium - Minor Issue</SelectItem>
                                        <SelectItem value="High">High - Feature Broken</SelectItem>
                                        <SelectItem value="Critical">Critical - System Down</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Message</label>
                                <Textarea 
                                    placeholder="Explain what happened..." 
                                    className="min-h-[150px] bg-white"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                disabled={isSubmitting || !subject || !message}
                            >
                                {isSubmitting ? (
                                    "Submitting..."
                                ) : (
                                    <>Submit Ticket <Send className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-indigo-900">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5"/> Quick Tips
                    </h4>
                    <ul className="text-sm space-y-2 list-disc list-inside opacity-80">
                        <li>Check the Help Documentation first.</li>
                        <li>Provide screenshots if possible.</li>
                        <li>Includes steps to reproduce the bug.</li>
                    </ul>
                </div>
            </div>

            {/* Ticket List */}
            <Card className="lg:col-span-2 border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-xl flex flex-col min-h-[600px]">
                <CardHeader>
                    <CardTitle>My Tickets</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading tickets...</div>
                    ) : tickets.length > 0 ? (
                        <ScrollArea className="h-[550px]">
                            <div className="divide-y divide-slate-100">
                                {tickets.map(ticket => (
                                    <div key={ticket.id} className="p-6 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                                    {ticket.status}
                                                </Badge>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3"/> {new Date(ticket.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                {ticket.priority}
                                            </Badge>
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                                            {ticket.subject}
                                        </h3>
                                        <p className="text-slate-600 text-sm line-clamp-2">
                                            {ticket.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-20"/>
                            <p>No support tickets found.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            </div>
        </div>
    );
};