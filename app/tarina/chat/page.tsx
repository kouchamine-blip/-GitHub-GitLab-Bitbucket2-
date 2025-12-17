'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, Image as ImageIcon, DollarSign, Check, X, Shield } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleContext';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface Conversation {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    title: string;
    price: number;
    image_url: string;
  } | null;
  other_user?: {
    id: string;
    full_name: string;
  } | null;
  last_message?: {
    content: string;
    created_at: string;
  } | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
  };
  offer?: Offer;
}

interface Offer {
  id: string;
  conversation_id: string;
  product_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COUNTERED';
  payment_status?: 'UNPAID' | 'PAID' | 'REFUNDED';
  message_id: string;
  created_at: string;
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [counterOfferAmount, setCounterOfferAmount] = useState('');
  const [showCounterOffer, setShowCounterOffer] = useState<string | null>(null);
  const conversationId = searchParams.get('conversation');

  useEffect(() => {
    if (!user) {
      router.push('/tarina/login');
      return;
    }

    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (conversationId) {
      fetchConversationDetails(conversationId);
      fetchMessages(conversationId);

      const channel = supabase
        .channel(`conversation-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orus_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => [...prev, newMsg]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orus_conversations')
        .select(`
          id,
          product_id,
          buyer_id,
          seller_id,
          created_at,
          updated_at
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;

          const { data: userData } = await supabase
            .from('orus_users')
            .select('id, full_name')
            .eq('id', otherUserId)
            .maybeSingle();

          const { data: productData } = await supabase
            .from('orus_products')
            .select('id, title, price, image_url')
            .eq('id', conv.product_id)
            .maybeSingle();

          const { data: lastMessage } = await supabase
            .from('orus_messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...conv,
            product: productData,
            other_user: userData,
            last_message: lastMessage,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationDetails = async (convId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orus_conversations')
        .select(`
          *,
          product:orus_products!product_id(id, title, price, image_url)
        `)
        .eq('id', convId)
        .single();

      if (error) throw error;

      const otherUserId = data.buyer_id === user.id ? data.seller_id : data.buyer_id;

      const { data: userData } = await supabase
        .from('orus_users')
        .select('id, full_name')
        .eq('id', otherUserId)
        .single();

      setSelectedConversation({
        ...data,
        other_user: userData,
      });
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('orus_messages')
        .select(`
          *,
          sender:orus_users!sender_id(full_name)
        `)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithOffers = await Promise.all(
        (messagesData || []).map(async (msg) => {
          const { data: offerData } = await supabase
            .from('orus_offers')
            .select('id, conversation_id, product_id, sender_id, receiver_id, amount, status, payment_status, message_id, created_at')
            .eq('message_id', msg.id)
            .maybeSingle();

          return {
            ...msg,
            offer: offerData,
          };
        })
      );

      setMessages(messagesWithOffers);

      await supabase
        .from('orus_messages')
        .update({ read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', user?.id);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !conversationId || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('orus_messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            content: newMessage.trim(),
          },
        ]);

      if (error) throw error;
      setNewMessage('');
      fetchMessages(conversationId);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !conversationId || !offerAmount || !selectedConversation?.product) return;

    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const { data: messageData, error: messageError } = await supabase
        .from('orus_messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            content: `Offer: ${amount}€`,
          },
        ])
        .select()
        .single();

      if (messageError) throw messageError;

      const receiverId = selectedConversation.buyer_id === user.id
        ? selectedConversation.seller_id
        : selectedConversation.buyer_id;

      const { error: offerError } = await supabase
        .from('orus_offers')
        .insert([
          {
            conversation_id: conversationId,
            product_id: selectedConversation.product.id,
            sender_id: user.id,
            receiver_id: receiverId,
            amount: amount,
            message_id: messageData.id,
          },
        ]);

      if (offerError) throw offerError;

      setOfferAmount('');
      setShowOfferInput(false);
      fetchMessages(conversationId);
    } catch (error) {
      console.error('Error sending offer:', error);
    }
  };

  const handleAcceptOffer = async (offer: Offer) => {
    if (!user || !selectedConversation) return;

    try {
      const { error: updateError } = await supabase
        .from('orus_offers')
        .update({ status: 'ACCEPTED', payment_status: 'UNPAID' })
        .eq('id', offer.id);

      if (updateError) throw updateError;

      const { data: senderData } = await supabase
        .from('orus_users')
        .select('full_name')
        .eq('id', offer.sender_id)
        .single();

      const { error: messageError } = await supabase
        .from('orus_messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            content: `${user.id === selectedConversation.seller_id ? 'Offer accepted!' : 'Your offer was accepted!'}`,
          },
        ]);

      if (messageError) throw messageError;

      fetchMessages(conversationId!);
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  };

  const handleDeclineOffer = async (offer: Offer) => {
    if (!user || !selectedConversation) return;

    try {
      const { error: updateError } = await supabase
        .from('orus_offers')
        .update({ status: 'DECLINED' })
        .eq('id', offer.id);

      if (updateError) throw updateError;

      const { data: userData } = await supabase
        .from('orus_users')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const declineMessage = user.id === selectedConversation.seller_id
        ? `${userData?.full_name} declined your offer of ${offer.amount}€`
        : `You declined the offer of ${offer.amount}€`;

      const { error: messageError } = await supabase
        .from('orus_messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            content: declineMessage,
          },
        ]);

      if (messageError) throw messageError;

      fetchMessages(conversationId!);
    } catch (error) {
      console.error('Error declining offer:', error);
    }
  };

  const handleSendCounterOffer = async (originalOfferId: string) => {
    if (!user || !conversationId || !counterOfferAmount || !selectedConversation?.product) return;

    const amount = parseFloat(counterOfferAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const { error: updateError } = await supabase
        .from('orus_offers')
        .update({ status: 'COUNTERED' })
        .eq('id', originalOfferId);

      if (updateError) throw updateError;

      const { data: userData } = await supabase
        .from('orus_users')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { data: messageData, error: messageError } = await supabase
        .from('orus_messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            content: `${userData?.full_name} is proposing a new price: ${amount}€`,
          },
        ])
        .select()
        .single();

      if (messageError) throw messageError;

      const receiverId = selectedConversation.buyer_id === user.id
        ? selectedConversation.seller_id
        : selectedConversation.buyer_id;

      const { error: offerError } = await supabase
        .from('orus_offers')
        .insert([
          {
            conversation_id: conversationId,
            product_id: selectedConversation.product.id,
            sender_id: user.id,
            receiver_id: receiverId,
            amount: amount,
            message_id: messageData.id,
          },
        ]);

      if (offerError) throw offerError;

      setCounterOfferAmount('');
      setShowCounterOffer(null);
      fetchMessages(conversationId);
    } catch (error) {
      console.error('Error sending counter-offer:', error);
    }
  };

  const handlePayOffer = async (offer: Offer) => {
    if (!user || !selectedConversation?.product || !conversationId) return;

    try {
      const { data: transactionData, error: transactionError } = await supabase
        .from('orus_transactions')
        .insert([
          {
            product_id: selectedConversation.product.id,
            buyer_id: user.id,
            seller_id: selectedConversation.seller_id,
            montant_total: offer.amount * 1.1,
            commission_plateforme: offer.amount * 0.1,
            montant_vendeur_net: offer.amount,
            payment_method: 'WALLET',
            funds_released: false,
          },
        ])
        .select('id')
        .single();

      if (transactionError) throw transactionError;

      const { error: offerUpdateError } = await supabase
        .from('orus_offers')
        .update({
          payment_status: 'PAID',
          transaction_id: transactionData.id,
        })
        .eq('id', offer.id);

      if (offerUpdateError) throw offerUpdateError;

      const { error: productUpdateError } = await supabase
        .from('orus_products')
        .update({
          buyer_id: user.id,
          status_logistique: 'VENDU'
        })
        .eq('id', selectedConversation.product.id);

      if (productUpdateError) throw productUpdateError;

      const { error: messageError } = await supabase
        .from('orus_messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            content: `Payment completed! Amount paid: ${offer.amount}€`,
          },
        ]);

      if (messageError) throw messageError;

      fetchMessages(conversationId);
      router.push('/tarina/profile');
    } catch (error) {
      console.error('Error completing payment:', error);
      alert('Failed to complete payment. Please try again.');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-tarina-offwhite dark:bg-gray-900">
        <div className="text-tarina-orange dark:text-tarina-amber text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (conversationId && selectedConversation) {
    return (
      <div className="flex flex-col h-screen bg-tarina-offwhite dark:bg-gray-900">
        <div className="bg-tarina-cream dark:bg-gray-800 border-b border-tarina-beige dark:border-gray-700 px-4 py-4 flex items-center space-x-3 shadow-sm">
          <button
            onClick={() => router.push('/tarina/chat')}
            className="p-2 hover:bg-tarina-beige-light dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-tarina-brown dark:text-white" />
          </button>

          <div className="flex items-center space-x-3 flex-1">
            {selectedConversation.product && (
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-tarina-beige dark:border-gray-700">
                <img
                  src={selectedConversation.product.image_url}
                  alt={selectedConversation.product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h2 className="font-semibold text-tarina-brown dark:text-white">
                {selectedConversation.other_user?.full_name}
              </h2>
              {selectedConversation.product && (
                <p className="text-sm text-tarina-brown-light dark:text-gray-400">
                  {selectedConversation.product.title}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {selectedConversation.product && (
            <div
              onClick={() => router.push(`/tarina/product/${selectedConversation.product?.id}`)}
              className="bg-tarina-cream dark:bg-gray-800 rounded-2xl p-4 border border-tarina-beige dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={selectedConversation.product.image_url}
                    alt={selectedConversation.product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-tarina-brown dark:text-white mb-1">
                    {selectedConversation.product.title}
                  </h3>
                  <p className="text-xl font-bold text-tarina-orange dark:text-tarina-amber">
                    {selectedConversation.product.price}€
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isOwnMessage = msg.sender_id === user?.id;
            const hasOffer = msg.offer && msg.offer.status === 'PENDING';
            const canRespondToOffer = hasOffer && msg.offer!.receiver_id === user?.id;
            const hasAcceptedOffer = msg.offer && msg.offer.status === 'ACCEPTED' && msg.offer.payment_status === 'UNPAID';
            const canPayOffer = hasAcceptedOffer && msg.offer!.sender_id === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isOwnMessage
                      ? 'bg-tarina-orange dark:bg-tarina-amber text-white'
                      : 'bg-tarina-cream dark:bg-gray-800 text-tarina-brown dark:text-white border border-tarina-beige dark:border-gray-700'
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage
                        ? 'text-white/80'
                        : 'text-tarina-brown-light dark:text-gray-400'
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>

                {canPayOffer && (
                  <div className="mt-2 w-full max-w-[75%]">
                    <button
                      onClick={() => handlePayOffer(msg.offer!)}
                      className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg"
                    >
                      <Shield className="w-5 h-5" />
                      <span>Pay Agreed Amount: {msg.offer!.amount}€</span>
                    </button>
                    <p className="text-center text-xs text-tarina-brown-light dark:text-gray-400 mt-1">
                      Total with protection: {(msg.offer!.amount * 1.1).toFixed(2)}€
                    </p>
                  </div>
                )}

                {canRespondToOffer && (
                  <div className="mt-2 space-y-2 w-full max-w-[75%]">
                    {showCounterOffer === msg.offer!.id ? (
                      <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-tarina-beige dark:border-gray-700">
                        <label className="block text-sm font-medium text-tarina-brown dark:text-gray-300 mb-2">
                          Counter with your price:
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={counterOfferAmount}
                            onChange={(e) => setCounterOfferAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="flex-1 px-3 py-2 rounded-lg border border-tarina-beige dark:border-gray-700 bg-white dark:bg-gray-800 text-tarina-brown dark:text-white focus:ring-2 focus:ring-tarina-orange dark:focus:ring-tarina-amber"
                          />
                          <button
                            onClick={() => handleSendCounterOffer(msg.offer!.id)}
                            className="px-4 py-2 bg-tarina-orange dark:bg-tarina-amber text-white rounded-lg hover:bg-tarina-orange-dark dark:hover:bg-tarina-amber-dark transition-colors"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => setShowCounterOffer(null)}
                            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptOffer(msg.offer!)}
                          className="flex-1 flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => setShowCounterOffer(msg.offer!.id)}
                          className="flex-1 flex items-center justify-center space-x-2 bg-tarina-orange dark:bg-tarina-amber hover:bg-tarina-orange-dark dark:hover:bg-tarina-amber-dark text-white font-semibold py-2 px-4 rounded-xl transition-colors"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>Counter</span>
                        </button>
                        <button
                          onClick={() => handleDeclineOffer(msg.offer!)}
                          className="flex-1 flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-xl transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-tarina-cream dark:bg-gray-800 border-t border-tarina-beige dark:border-gray-700 px-4 py-4">
          {showOfferInput ? (
            <form onSubmit={handleSendOffer} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-tarina-brown dark:text-gray-300 mb-2">
                  Make an offer:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="Enter amount (€)"
                    className="flex-1 px-4 py-3 rounded-2xl border border-tarina-beige dark:border-gray-700 bg-white dark:bg-gray-900 text-tarina-brown dark:text-white placeholder-tarina-brown-light dark:placeholder-gray-400 focus:ring-2 focus:ring-tarina-orange dark:focus:ring-tarina-amber focus:border-transparent transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!offerAmount || parseFloat(offerAmount) <= 0}
                    className="p-3 rounded-full bg-tarina-orange dark:bg-tarina-amber text-white hover:bg-tarina-orange-dark dark:hover:bg-tarina-amber-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOfferInput(false);
                      setOfferAmount('');
                    }}
                    className="p-3 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSendMessage}>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOfferInput(true)}
                  className="p-3 rounded-full bg-tarina-beige-light dark:bg-gray-700 text-tarina-orange dark:text-tarina-amber hover:bg-tarina-beige dark:hover:bg-gray-600 transition-colors"
                  title="Make an offer"
                >
                  <DollarSign className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-2xl border border-tarina-beige dark:border-gray-700 bg-white dark:bg-gray-900 text-tarina-brown dark:text-white placeholder-tarina-brown-light dark:placeholder-gray-400 focus:ring-2 focus:ring-tarina-orange dark:focus:ring-tarina-amber focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 rounded-full bg-tarina-orange dark:bg-tarina-amber text-white hover:bg-tarina-orange-dark dark:hover:bg-tarina-amber-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 min-h-screen bg-tarina-offwhite dark:bg-gray-900">
      <h1 className="text-3xl font-bold text-tarina-brown dark:text-tarina-amber mb-6">
        {t('messages')}
      </h1>

      {conversations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-tarina-brown-light dark:text-gray-400 text-lg">No conversations yet</p>
          <button
            onClick={() => router.push('/tarina/find')}
            className="mt-4 px-6 py-3 bg-tarina-orange dark:bg-tarina-amber text-white rounded-xl font-semibold hover:bg-tarina-orange-dark dark:hover:bg-tarina-amber-dark transition-colors"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => router.push(`/tarina/chat?conversation=${conv.id}`)}
              className="bg-tarina-cream dark:bg-gray-800 rounded-2xl p-4 border border-tarina-beige dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start space-x-4">
                {conv.product && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-tarina-beige dark:border-gray-700">
                    <img
                      src={conv.product.image_url}
                      alt={conv.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-semibold text-tarina-brown dark:text-white">
                      {conv.other_user?.full_name}
                    </h3>
                    {conv.last_message && (
                      <span className="text-xs text-tarina-brown-light dark:text-gray-400">
                        {formatTime(conv.last_message.created_at)}
                      </span>
                    )}
                  </div>

                  {conv.product && (
                    <p className="text-sm text-tarina-brown-light dark:text-gray-400 mb-1">
                      {conv.product.title}
                    </p>
                  )}

                  {conv.last_message && (
                    <p className="text-sm text-tarina-brown-light dark:text-gray-400 truncate">
                      {conv.last_message.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-tarina-offwhite dark:bg-gray-900">
        <div className="text-tarina-orange dark:text-tarina-amber text-xl font-semibold">Loading...</div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
