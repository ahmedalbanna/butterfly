'use client';

import { useEffect, useState } from 'react';
import { getAllContacts, getContactStats } from '@/app/actions/admin-contacts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Mail, 
  Calendar, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign,
  UserCheck,
  ChevronRight,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date | null;
  memberSince: Date;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState({
    totalContacts: 0,
    newThisMonth: 0,
    averageLTV: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [contactsResult, statsResult] = await Promise.all([
      getAllContacts(),
      getContactStats()
    ]);

    if (contactsResult.success && contactsResult.contacts) {
      setContacts(contactsResult.contacts as Contact[]);
    }
    if (statsResult.success && statsResult.stats) {
      setStats(statsResult.stats);
    }
    setIsLoading(false);
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-headline italic text-white mb-2">Boutique Contacts</h1>
          <p className="text-sm text-white/60 uppercase tracking-wider">Manage your elite clientele and acquisitions</p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input 
              placeholder="Search collectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-white/20"
            />
          </div>
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Collectors', value: stats.totalContacts, icon: Users, color: 'text-blue-400' },
          { label: 'New This Month', value: stats.newThisMonth, icon: UserCheck, color: 'text-green-400' },
          { label: 'Avg. Investment', value: `$${stats.averageLTV.toLocaleString()}`, icon: TrendingUp, color: 'text-primary' }
        ].map((stat) => (
          <Card key={stat.label} className="bg-black/40 border-white/10">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-headline font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contacts Table */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-20 bg-black/40 border border-white/10 rounded-lg">
          <Users className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 italic">No contacts found matching your criteria</p>
        </div>
      ) : (
        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-black/60 border-b border-white/10 text-left">
              <tr>
                <th className="px-6 py-4 text-xs uppercase tracking-wider text-white/60 font-bold">Collector</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider text-white/60 font-bold">Status</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider text-white/60 font-bold">Acquisitions</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider text-white/60 font-bold">Total Investment</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider text-white/60 font-bold">Member Since</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-wider text-white/60 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-headline italic">
                        {contact.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-headline text-white group-hover:text-primary transition-colors">{contact.name}</p>
                        <p className="text-xs text-white/40 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {contact.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 uppercase text-[8px] tracking-widest">
                      Verified
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-white/80">
                      <ShoppingBag className="w-4 h-4 text-primary/60" />
                      <span className="font-bold">{contact.totalOrders}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <DollarSign className="w-3 h-3" />
                      {contact.totalSpent.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(contact.memberSince), 'MMM yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="text-white/40 hover:text-primary hover:bg-primary/10">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
