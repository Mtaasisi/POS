// AI Training Data Generated from Chat Analysis
// Generated on: 2025-08-21T14:10:06.767Z

// Enhanced AI analysis function based on your chat patterns
function analyzeMessageWithTrainedAI(messageText, sender) {
  const lowerMessage = messageText.toLowerCase();

  const analysis = {
    shouldReply: false,
    confidence: 0.5,
    action: 'ignore',
    category: 'other',
    replyMessage: null
  };

  // SERVICE_INQUIRY - Based on your chat patterns
  if (lowerMessage.includes('hi,' || lowerMessage.includes('you' || lowerMessage.includes('repair' || lowerMessage.includes('phones?' || lowerMessage.includes('hi, do' || lowerMessage.includes('do you' || lowerMessage.includes('you repair' || lowerMessage.includes('repair phones?' || lowerMessage.includes('hi, do you' || lowerMessage.includes('do you repair' || lowerMessage.includes('you repair phones?')) {
    analysis.shouldReply = true;
    analysis.confidence = 0.8;
    analysis.action = 'auto_reply';
    analysis.category = 'service_inquiry';
    analysis.replyMessage = 'Yes! Tuna huduma za kurekebisha simu, laptop, na vifaa vingine. Una tatizo gani? Unaweza kuja ofisini au tutumie technician kwenu.';
  }

  // PRICING - Based on your chat patterns
  if (lowerMessage.includes('what's' || lowerMessage.includes('the' || lowerMessage.includes('price' || lowerMessage.includes('for' || lowerMessage.includes('screen' || lowerMessage.includes('replacement?' || lowerMessage.includes('what's the' || lowerMessage.includes('the price' || lowerMessage.includes('price for' || lowerMessage.includes('for screen' || lowerMessage.includes('screen replacement?' || lowerMessage.includes('what's the price' || lowerMessage.includes('the price for' || lowerMessage.includes('price for screen' || lowerMessage.includes('for screen replacement?' || lowerMessage.includes('how' || lowerMessage.includes('much' || lowerMessage.includes('iphone' || lowerMessage.includes('battery' || lowerMessage.includes('how much' || lowerMessage.includes('much for' || lowerMessage.includes('for iphone' || lowerMessage.includes('iphone battery' || lowerMessage.includes('battery replacement?' || lowerMessage.includes('how much for' || lowerMessage.includes('much for iphone' || lowerMessage.includes('for iphone battery' || lowerMessage.includes('iphone battery replacement?')) {
    analysis.shouldReply = true;
    analysis.confidence = 0.8;
    analysis.action = 'auto_reply';
    analysis.category = 'pricing';
    analysis.replyMessage = 'Bei ya kubadili battery ya iPhone: 25,000-50,000 kulingana na model. Tuna dhamana ya siku 30. Unaweza kuja ofisini au tutumie technician kwenu.';
  }

  // TECHNICAL_SUPPORT - Based on your chat patterns
  if (lowerMessage.includes('phone' || lowerMessage.includes('not' || lowerMessage.includes('charging' || lowerMessage.includes('my phone' || lowerMessage.includes('phone is' || lowerMessage.includes('is not' || lowerMessage.includes('not charging' || lowerMessage.includes('my phone is' || lowerMessage.includes('phone is not' || lowerMessage.includes('is not charging')) {
    analysis.shouldReply = true;
    analysis.confidence = 0.8;
    analysis.action = 'auto_reply';
    analysis.category = 'technical_support';
    analysis.replyMessage = 'Tunaona tatizo lako! Hiyo inaweza kuwa battery au charging port. Mtaalamu wetu atakusaidia haraka. Unaweza kuja leo au kesho? Au tutumie technician kwenu.';
  }

  // LOCATION - Based on your chat patterns
  if (lowerMessage.includes('where' || lowerMessage.includes('are' || lowerMessage.includes('you' || lowerMessage.includes('located?' || lowerMessage.includes('where are' || lowerMessage.includes('are you' || lowerMessage.includes('you located?' || lowerMessage.includes('where are you' || lowerMessage.includes('are you located?')) {
    analysis.shouldReply = true;
    analysis.confidence = 0.8;
    analysis.action = 'auto_reply';
    analysis.category = 'location';
    analysis.replyMessage = 'Tupo Dar es Salaam! Unaweza kuja ofisini au tutumie technician kwenu. Tafadhali tuambie mahali ulipo (mtaa, jiji) ili tupate kukusaidia.';
  }

  // SCHEDULE - Based on your chat patterns
  if (lowerMessage.includes('you' || lowerMessage.includes('work' || lowerMessage.includes('weekends?' || lowerMessage.includes('do you' || lowerMessage.includes('you work' || lowerMessage.includes('work on' || lowerMessage.includes('on weekends?' || lowerMessage.includes('do you work' || lowerMessage.includes('you work on' || lowerMessage.includes('work on weekends?')) {
    analysis.shouldReply = true;
    analysis.confidence = 0.8;
    analysis.action = 'auto_reply';
    analysis.category = 'schedule';
    analysis.replyMessage = 'Tuna kazi Jumamosi na Jumapili pia! Masaa: 8:00 AM - 8:00 PM. Unaweza kuja weekend au tutumie technician kwenu.';
  }

  // URGENT - Based on your chat patterns
  if (lowerMessage.includes('need' || lowerMessage.includes('urgent' || lowerMessage.includes('repair' || lowerMessage.includes('i need' || lowerMessage.includes('need urgent' || lowerMessage.includes('urgent repair' || lowerMessage.includes('i need urgent' || lowerMessage.includes('need urgent repair')) {
    analysis.shouldReply = true;
    analysis.confidence = 0.8;
    analysis.action = 'auto_reply';
    analysis.category = 'urgent';
    analysis.replyMessage = 'Tunaona hiyo ni dharura! Tutakusaidia haraka iwezekanavyo. Unaweza kuja ofisini sasa au tutumie technician kwenu mara moja. Tafadhali tuambie tatizo lako kwa undani zaidi.';
  }

  // WARRANTY - Based on your chat patterns
  if (lowerMessage.includes('you' || lowerMessage.includes('have' || lowerMessage.includes('warranty?' || lowerMessage.includes('do you' || lowerMessage.includes('you have' || lowerMessage.includes('have warranty?' || lowerMessage.includes('do you have' || lowerMessage.includes('you have warranty?')) {
    analysis.shouldReply = true;
    analysis.confidence = 0.8;
    analysis.action = 'auto_reply';
    analysis.category = 'warranty';
    analysis.replyMessage = 'Tuna dhamana ya siku 30 kwa huduma zetu. Ikiwa kuna tatizo tena ndani ya siku 30, tutarekebisha bila malipo. Tuna uhakika wa huduma bora!';
  }

  // APPOINTMENT - Based on your chat patterns
  if (lowerMessage.includes('can' || lowerMessage.includes('you' || lowerMessage.includes('come' || lowerMessage.includes('house?' || lowerMessage.includes('can you' || lowerMessage.includes('you come' || lowerMessage.includes('come to' || lowerMessage.includes('to my' || lowerMessage.includes('my house?' || lowerMessage.includes('can you come' || lowerMessage.includes('you come to' || lowerMessage.includes('come to my' || lowerMessage.includes('to my house?')) {
    analysis.shouldReply = true;
    analysis.confidence = 0.8;
    analysis.action = 'auto_reply';
    analysis.category = 'appointment';
    analysis.replyMessage = 'Ndio! Tuna huduma za technician kwenu. Bei: Tsh 10,000 kwa huduma ya technician. Tafadhali tuambie mahali ulipo na tutumie mtaalamu kwenu.';
  }

  // APPRECIATION - Based on your chat patterns
  if (lowerMessage.includes('thank' || lowerMessage.includes('you' || lowerMessage.includes('for' || lowerMessage.includes('the' || lowerMessage.includes('good' || lowerMessage.includes('service' || lowerMessage.includes('thank you' || lowerMessage.includes('you for' || lowerMessage.includes('for the' || lowerMessage.includes('the good' || lowerMessage.includes('good service' || lowerMessage.includes('thank you for' || lowerMessage.includes('you for the' || lowerMessage.includes('for the good' || lowerMessage.includes('the good service')) {
    analysis.shouldReply = true;
    analysis.confidence = 0.8;
    analysis.action = 'auto_reply';
    analysis.category = 'appreciation';
    analysis.replyMessage = 'Asante sana! Tunafurahi kukusaidia. Tunajali huduma zetu na tunataka kuhakikisha una huduma bora kila wakati. Karibu tena!';
  }

  return analysis;
}
