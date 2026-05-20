'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Loader2, ExternalLink, MessageCircle, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function LeadsPage() {
  const db = useFirestore();
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeads = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [db]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-primary">Leads</h1>
          <p className="text-muted-foreground mt-1 font-medium">Manage potential customers from the landing page</p>
        </div>
        <Button variant="outline" onClick={fetchLeads} disabled={isLoading} className="gap-2 font-bold">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle>Recent Leads ({leads.length})</CardTitle>
          <CardDescription>All leads submitted via the pricing modal.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold text-foreground">No leads yet</h3>
              <p className="text-muted-foreground mt-1">When customers submit the registration form on the landing page, they will appear here.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Cafe Name</TableHead>
                    <TableHead className="font-bold">Owner</TableHead>
                    <TableHead className="font-bold">Contact</TableHead>
                    <TableHead className="font-bold">Location & Branches</TableHead>
                    <TableHead className="font-bold">Requested Plan</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {lead.createdAt ? format(lead.createdAt.toDate(), 'dd MMM yyyy, HH:mm') : 'Unknown'}
                      </TableCell>
                      <TableCell className="font-bold text-foreground">{lead.cafeName}</TableCell>
                      <TableCell>{lead.ownerName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">{lead.phone}</a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">{lead.city}</span>
                        <br />
                        <span className="text-xs text-muted-foreground">{lead.branches} Branch(es)</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {lead.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="gap-2 font-bold text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800" asChild>
                           <a href={`https://wa.me/${lead.phone}?text=${encodeURIComponent(`Hello ${lead.ownerName}, thank you for your interest in CafeQR! I saw you requested the ${lead.plan} plan for ${lead.cafeName}. How can I assist you with the setup?`)}`} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="w-4 h-4" /> WhatsApp
                           </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
