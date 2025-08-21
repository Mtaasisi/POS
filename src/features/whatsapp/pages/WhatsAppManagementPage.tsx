import React, { useState, useEffect } from 'react';
import { useWhatsApp } from '../../../hooks/useWhatsApp';
import { WhatsAppInstance, WhatsAppMessage } from '../../../services/whatsappService';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Textarea } from '../../../shared/components/ui/Textarea';
import { Badge } from '../../../shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../shared/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/Select';
import { Alert, AlertDescription } from '../../../shared/components/ui/Alert';
import { Loader2, MessageSquare, Phone, QrCode, Send, Trash2, Plus, RefreshCw } from 'lucide-react';

export default function WhatsAppManagementPage() {
  const {
    instances,
    loading,
    error,
    createInstance,
    deleteInstance,
    getQRCode,
    getInstanceState,
    sendTextMessage,
    sendFileMessage,
    getChatHistory,
    checkWhatsApp,
    getContacts,
    refreshInstances,
  } = useWhatsApp();

  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  const [selectedChat, setSelectedChat] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<WhatsAppMessage[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileCaption, setFileCaption] = useState('');
  const [phoneToCheck, setPhoneToCheck] = useState('');
  const [isWhatsAppAvailable, setIsWhatsAppAvailable] = useState<boolean | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newInstanceData, setNewInstanceData] = useState({
    phoneNumber: '',
    apiToken: ''
  });

  // Load chat history when instance and chat are selected
  useEffect(() => {
    if (selectedInstance && selectedChat) {
      loadChatHistory();
    }
  }, [selectedInstance, selectedChat]);

  // Load contacts when instance is selected
  useEffect(() => {
    if (selectedInstance) {
      loadContacts();
    }
  }, [selectedInstance]);

  const loadChatHistory = async () => {
    if (!selectedInstance || !selectedChat) return;
    
    try {
      const history = await getChatHistory(selectedInstance.instanceId, selectedChat);
      setChatHistory(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const loadContacts = async () => {
    if (!selectedInstance) return;
    
    try {
      const contactsList = await getContacts(selectedInstance.instanceId);
      setContacts(contactsList);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const handleCreateInstance = async () => {
    try {
      await createInstance(newInstanceData.phoneNumber, newInstanceData.apiToken || undefined);
      setShowCreateDialog(false);
      setNewInstanceData({ phoneNumber: '', apiToken: '' });
    } catch (error) {
      console.error('Failed to create instance:', error);
    }
  };

  const handleGetQRCode = async (instance: WhatsAppInstance) => {
    try {
      const qr = await getQRCode(instance.instanceId);
      setQrCode(qr);
      setShowQRDialog(true);
    } catch (error) {
      console.error('Failed to get QR code:', error);
    }
  };

  const handleCheckWhatsApp = async () => {
    if (!selectedInstance || !phoneToCheck) return;
    
    try {
      const available = await checkWhatsApp(selectedInstance.instanceId, phoneToCheck);
      setIsWhatsAppAvailable(available);
    } catch (error) {
      console.error('Failed to check WhatsApp:', error);
    }
  };

  const handleSendTextMessage = async () => {
    if (!selectedInstance || !selectedChat || !messageText.trim()) return;
    
    try {
      await sendTextMessage(selectedInstance.instanceId, selectedChat, messageText);
      setMessageText('');
      loadChatHistory(); // Refresh chat history
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSendFileMessage = async () => {
    if (!selectedInstance || !selectedChat || !fileUrl.trim()) return;
    
    try {
      await sendFileMessage(selectedInstance.instanceId, selectedChat, fileUrl, fileCaption);
      setFileUrl('');
      setFileCaption('');
      loadChatHistory(); // Refresh chat history
    } catch (error) {
      console.error('Failed to send file:', error);
    }
  };

  const handleDeleteInstance = async (instance: WhatsAppInstance) => {
    if (confirm(`Are you sure you want to delete instance ${instance.phoneNumber}?`)) {
      try {
        await deleteInstance(instance.instanceId);
        if (selectedInstance?.instanceId === instance.instanceId) {
          setSelectedInstance(null);
          setSelectedChat('');
        }
      } catch (error) {
        console.error('Failed to delete instance:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading WhatsApp instances...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">WhatsApp Management</h1>
        <div className="flex gap-2">
          <Button onClick={refreshInstances} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Instance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New WhatsApp Instance</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <Input
                    placeholder="255XXXXXXXXX"
                    value={newInstanceData.phoneNumber}
                    onChange={(e) => setNewInstanceData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">API Token (Optional)</label>
                  <Input
                    type="password"
                    placeholder="Leave empty to use default token from environment"
                    value={newInstanceData.apiToken}
                    onChange={(e) => setNewInstanceData(prev => ({ ...prev, apiToken: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    If left empty, will use VITE_GREEN_API_TOKEN from environment variables
                  </p>
                </div>
                <Button onClick={handleCreateInstance} className="w-full">
                  Create Instance
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instances List */}
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Instances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {instances.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No instances found. Create your first instance to get started.
                </p>
              ) : (
                instances.map((instance) => (
                  <div
                    key={instance.instanceId}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedInstance?.instanceId === instance.instanceId
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedInstance(instance)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span className="font-medium">{instance.phoneNumber}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(instance.status)}`} />
                        <Badge variant="secondary" className="text-xs">
                          {instance.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {instance.instanceId}
                      </span>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetQRCode(instance);
                          }}
                        >
                          <QrCode className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteInstance(instance);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {selectedInstance ? (
            <>
              {/* Instance Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Instance: {selectedInstance.phoneNumber}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => getInstanceState(selectedInstance.instanceId)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Status
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge className={`ml-2 ${getStatusColor(selectedInstance.status)}`}>
                        {selectedInstance.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Instance ID:</span>
                      <span className="ml-2 font-mono text-xs">{selectedInstance.instanceId}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for different features */}
              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="check">Check WhatsApp</TabsTrigger>
                  <TabsTrigger value="send">Send Message</TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Chat History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Select Chat</label>
                          <Select value={selectedChat} onValueChange={setSelectedChat}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a chat..." />
                            </SelectTrigger>
                            <SelectContent>
                              {contacts.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id}>
                                  {contact.name || contact.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {selectedChat && (
                          <div className="border rounded-lg p-4 h-96 overflow-y-auto">
                            {chatHistory.length === 0 ? (
                              <p className="text-muted-foreground text-center py-8">
                                No messages in this chat yet.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {chatHistory.map((message) => (
                                  <div
                                    key={message.id}
                                    className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div
                                      className={`max-w-xs p-3 rounded-lg ${
                                        message.direction === 'outgoing'
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted'
                                      }`}
                                    >
                                      <p className="text-sm">{message.content}</p>
                                      <p className="text-xs opacity-70 mt-1">
                                        {new Date(message.timestamp).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contacts" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {contacts.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            No contacts found.
                          </p>
                        ) : (
                          contacts.map((contact) => (
                            <div
                              key={contact.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{contact.name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">{contact.id}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedChat(contact.id)}
                              >
                                Chat
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="check" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Check WhatsApp Availability</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Phone Number</label>
                          <div className="flex space-x-2">
                            <Input
                              placeholder="255XXXXXXXXX"
                              value={phoneToCheck}
                              onChange={(e) => setPhoneToCheck(e.target.value)}
                            />
                            <Button onClick={handleCheckWhatsApp}>
                              Check
                            </Button>
                          </div>
                        </div>
                        
                        {isWhatsAppAvailable !== null && (
                          <Alert>
                            <AlertDescription>
                              {isWhatsAppAvailable ? (
                                <span className="text-green-600">✓ This number is available on WhatsApp</span>
                              ) : (
                                <span className="text-red-600">✗ This number is not available on WhatsApp</span>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="send" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Send Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">To (Phone Number)</label>
                          <Input
                            placeholder="255XXXXXXXXX"
                            value={selectedChat}
                            onChange={(e) => setSelectedChat(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Message</label>
                          <Textarea
                            placeholder="Type your message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            rows={3}
                          />
                        </div>
                        
                        <Button onClick={handleSendTextMessage} disabled={!selectedChat || !messageText.trim()}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                        
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-2">Send File</h4>
                          <div className="space-y-2">
                            <Input
                              placeholder="File URL"
                              value={fileUrl}
                              onChange={(e) => setFileUrl(e.target.value)}
                            />
                            <Input
                              placeholder="Caption (optional)"
                              value={fileCaption}
                              onChange={(e) => setFileCaption(e.target.value)}
                            />
                            <Button onClick={handleSendFileMessage} disabled={!selectedChat || !fileUrl.trim()}>
                              Send File
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Instance Selected</h3>
                  <p className="text-muted-foreground">
                    Select a WhatsApp instance from the list to start managing it.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code for Authentication</DialogTitle>
          </DialogHeader>
          <div className="text-center">
            {qrCode ? (
              <div className="space-y-4">
                <img
                  src={`data:image/png;base64,${qrCode}`}
                  alt="QR Code"
                  className="mx-auto border rounded-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your WhatsApp mobile app to authenticate this instance.
                </p>
              </div>
            ) : (
              <p>Loading QR code...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
