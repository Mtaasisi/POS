import { EmailTemplate } from '../services/emailService';

export const defaultEmailTemplates: Omit<EmailTemplate, 'id' | 'isActive'>[] = [
  {
    name: 'Welcome New Customer',
    subject: 'Welcome to {{name}} - Your Device Repair Partner',
    content: `
Dear {{firstName}},

Welcome to our repair service! We're excited to have you as a customer.

Your account details:
- Customer ID: {{customerId}}
- Loyalty Level: {{loyaltyLevel}}
- Points: {{points}}

We offer:
✅ Fast and reliable device repairs
✅ Professional technicians
✅ Warranty on all repairs
✅ Loyalty points program
✅ Free diagnostics

If you have any questions, feel free to contact us.

Best regards,
The Repair Team
    `,
    variables: ['name', 'firstName', 'customerId', 'loyaltyLevel', 'points'],
    category: 'service'
  },
  {
    name: 'Repair Status Update',
    subject: 'Your {{deviceBrand}} {{deviceModel}} Repair Update',
    content: `
Dear {{firstName}},

Your device repair is progressing well!

Device: {{deviceBrand}} {{deviceModel}}
Current Status: {{repairStatus}}
Expected Completion: {{expectedDate}}

We'll notify you as soon as your device is ready for pickup.

Track your repair: {{trackingLink}}

Thank you for choosing our service!

Best regards,
The Repair Team
    `,
    variables: ['firstName', 'deviceBrand', 'deviceModel', 'repairStatus', 'expectedDate', 'trackingLink'],
    category: 'service'
  },
  {
    name: 'Repair Complete Notification',
    subject: 'Your {{deviceBrand}} {{deviceModel}} is Ready!',
    content: `
Dear {{firstName}},

Great news! Your device repair is complete and ready for pickup.

Device: {{deviceBrand}} {{deviceModel}}
Repair Details: {{repairDetails}}
Total Cost: {{repairCost}}

Please collect your device within 7 days to avoid storage fees.

Location: {{pickupLocation}}
Hours: {{pickupHours}}

Thank you for choosing our service!

Best regards,
The Repair Team
    `,
    variables: ['firstName', 'deviceBrand', 'deviceModel', 'repairDetails', 'repairCost', 'pickupLocation', 'pickupHours'],
    category: 'service'
  },
  {
    name: 'Loyalty Points Update',
    subject: 'You earned {{pointsEarned}} loyalty points!',
    content: `
Dear {{firstName}},

Thank you for your recent repair! You've earned {{pointsEarned}} loyalty points.

Current Points Balance: {{totalPoints}}
Loyalty Level: {{loyaltyLevel}}

Points can be redeemed for:
🎁 Discounts on future repairs
🎁 Free diagnostics
🎁 Priority service
🎁 Special promotions

Redeem your points: {{redeemLink}}

Keep earning points with every repair!

Best regards,
The Repair Team
    `,
    variables: ['firstName', 'pointsEarned', 'totalPoints', 'loyaltyLevel', 'redeemLink'],
    category: 'loyalty'
  },
  {
    name: 'Birthday Special Offer',
    subject: 'Happy Birthday {{firstName}}! 🎉 Special Offer Inside',
    content: `
Dear {{firstName}},

Happy Birthday! 🎂

We hope you have a wonderful day! As a birthday gift, we're offering you:

🎁 20% off any repair this month
🎁 Free device cleaning
🎁 Priority service booking

Use code: BIRTHDAY20

This offer is valid until {{expiryDate}}.

Book your repair: {{bookingLink}}

Best regards,
The Repair Team
    `,
    variables: ['firstName', 'expiryDate', 'bookingLink'],
    category: 'birthday'
  },
  {
    name: 'VIP Customer Exclusive',
    subject: 'VIP Exclusive: {{promotionTitle}}',
    content: `
Dear {{firstName}},

As a VIP customer, you have exclusive access to our latest promotion:

{{promotionDetails}}

Special VIP Benefits:
⭐ Priority booking
⭐ Extended warranty
⭐ Free pickup & delivery
⭐ Dedicated support line

Book now: {{bookingLink}}

This offer is exclusive to VIP customers only.

Best regards,
The VIP Team
    `,
    variables: ['firstName', 'promotionTitle', 'promotionDetails', 'bookingLink'],
    category: 'promotional'
  },
  {
    name: 'Service Reminder',
    subject: 'Time for your device checkup, {{firstName}}',
    content: `
Dear {{firstName}},

It's been a while since your last visit. Your devices might need some attention!

We recommend:
🔧 Regular device maintenance
🔧 Software updates
🔧 Performance optimization
🔧 Battery health check

Book your appointment: {{bookingLink}}

Special offer: 15% off maintenance services this month!

Best regards,
The Repair Team
    `,
    variables: ['firstName', 'bookingLink'],
    category: 'reminder'
  },
  {
    name: 'Holiday Special',
    subject: '🎄 Holiday Special: {{specialOffer}}',
    content: `
Dear {{firstName}},

Happy Holidays! 🎄

We're spreading holiday cheer with special offers:

🎁 {{specialOffer}}
🎁 Free gift wrapping for devices
🎁 Extended warranty on holiday repairs
🎁 Gift cards available

Holiday Hours:
{{holidayHours}}

Book your repair: {{bookingLink}}

Wishing you a wonderful holiday season!

Best regards,
The Repair Team
    `,
    variables: ['firstName', 'specialOffer', 'holidayHours', 'bookingLink'],
    category: 'promotional'
  },
  {
    name: 'Customer Feedback Request',
    subject: 'How was your repair experience, {{firstName}}?',
    content: `
Dear {{firstName}},

We hope you're satisfied with your recent repair service.

We'd love to hear about your experience:
⭐ Rate your service: {{ratingLink}}
⭐ Leave a review: {{reviewLink}}
⭐ Share feedback: {{feedbackLink}}

Your feedback helps us improve our service for all customers.

Thank you for choosing us!

Best regards,
The Repair Team
    `,
    variables: ['firstName', 'ratingLink', 'reviewLink', 'feedbackLink'],
    category: 'service'
  },
  {
    name: 'Referral Program',
    subject: 'Earn rewards by referring friends, {{firstName}}!',
    content: `
Dear {{firstName}},

Did you know you can earn rewards by referring friends?

Refer a friend and get:
🎁 $20 credit for each successful referral
🎁 Bonus loyalty points
🎁 Priority booking for referrals

Your referral code: {{referralCode}}

Share this code with friends and family!

Track your referrals: {{referralLink}}

Best regards,
The Repair Team
    `,
    variables: ['firstName', 'referralCode', 'referralLink'],
    category: 'promotional'
  },
  {
    name: 'Seasonal Maintenance',
    subject: 'Prepare your devices for {{season}}, {{firstName}}',
    content: `
Dear {{firstName}},

{{season}} is here! Time to prepare your devices for the new season.

{{season}} Maintenance Tips:
{{maintenanceTips}}

Book your seasonal maintenance: {{bookingLink}}

Special {{season}} offer: {{seasonalOffer}}

Best regards,
The Repair Team
    `,
    variables: ['firstName', 'season', 'maintenanceTips', 'bookingLink', 'seasonalOffer'],
    category: 'reminder'
  }
];

export const getTemplateVariables = (template: EmailTemplate): string[] => {
  return template.variables || [];
};

// SMS Templates for Inauzwa
export const SMS_TEMPLATES = [
  {
    name: 'deviceReceived',
    message: `✅ Tumepokea Kimepokelewa!

Hellow Mtaasisi [Jina la Mteja],

Habari njema! [Model ya Kifaa] yako imepokelewa na sasa iko katika foleni ya ukarabati wa Inauzwa.

📋 Namba ya Kumbukumbu: #[Namba ya Tiketi]
📅 Tarehe ya Kupokea: [Tarehe]
🔧 Tatizo: [Maelezo mafupi]

Subiri ujumbe kupitia SMS kikiwa tayari!

Asante kwa kumtumaini Inauzwa 🚀`,
    variables: ['Jina la Mteja', 'Model ya Kifaa', 'Namba ya Tiketi', 'Tarehe', 'Maelezo mafupi']
  },
  {
    name: 'deviceReady',
    message: `🎉 Kifaa Chako Tayari!

Habari Mtaasisi [Jina la Mteja],

Habari njema! [Model ya Kifaa] yako imekamilika na tayari kuchukuliwa.

📋 Namba ya Kumbukumbu: #[Namba ya Tiketi]
✅ Tarehe ya Kukamilisha: [Tarehe]

Tafadhali uje kuchukua kifaa chako katika ofisi yetu ndani ya muda ili kuepuka usumbufu.

Asante kwa kumtumaini Inauzwa! 🚀`,
    variables: ['Jina la Mteja', 'Model ya Kifaa', 'Namba ya Tiketi', 'Tarehe']
  },
  {
    name: 'returnReceived',
    message: `📦 Kurudi Kimepokelewa!

Habari Mtaasisi [Jina la Mteja],

Habari njema! Tumepokea kurudi kwa [Model ya Kifaa] yako.

📋 Namba ya Return: #[Namba ya Return]
📅 Tarehe ya Kupokea: [Tarehe]
🔍 Sababu ya Kurudi: [Sababu ya Kurudi]

Tutaanza kuchunguza hali ya kifaa na kukupa majibu ndani ya siku 23.

Asante kwa kumtumaini Inauzwa! 🚀`,
    variables: ['Jina la Mteja', 'Model ya Kifaa', 'Namba ya Return', 'Tarehe', 'Sababu ya Kurudi']
  },
  {
    name: 'returnStatusUpdate',
    message: `📊 Hali ya Return Imebadilika!

Habari Mtaasisi [Jina la Mteja],

Hali ya return yako imebadilika:

📋 Namba ya Return: #[Namba ya Return]
📱 Kifaa: [Model ya Kifaa]
🔄 Hali Mpya: [Hali ya Return]
📅 Tarehe: [Tarehe]

Tutakupa majibu zaidi hivi karibuni.

Asante kwa kumtumaini Inauzwa! 🚀`,
    variables: ['Jina la Mteja', 'Model ya Kifaa', 'Namba ya Return', 'Tarehe', 'Hali ya Return']
  },
  {
    name: 'returnResolved',
    message: `✅ Return Imekamilika!

Habari Mtaasisi [Jina la Mteja],

Return yako imekamilika:

📋 Namba ya Return: #[Namba ya Return]
📱 Kifaa: [Model ya Kifaa]
📅 Tarehe: [Tarehe]
🎯 Uamuzi: [Uamuzi]

Tafadhali uje kuchukua kifaa chako au kupokea malipo yako.

Asante kwa kumtumaini Inauzwa! 🚀`,
    variables: ['Jina la Mteja', 'Model ya Kifaa', 'Namba ya Return', 'Tarehe', 'Uamuzi']
  }
]; 