/* Capra Studios: sample data for the AI Systems page demos.
   Tallgrass Landscaping is an invented nine-person company. Every document, name, price and date here is made up.
   The answers are prepared by hand. Nothing here calls an AI model or the network.
   Each source passage must be an exact piece of the document body, because the demo underlines it there. */
(function () {
  'use strict';

  var ALL = ['crew lead', 'office manager', 'owner'];
  var OFFICE = ['office manager', 'owner'];
  var OWNER = ['owner'];

  window.CAPRA_BRAIN_DEMO = {
    company: {
      name: 'Tallgrass Landscaping',
      people: 9,
      about: 'An invented nine-person landscaping company: an owner, an office manager, two crew leads and five crew members.'
    },

    roles: ALL,

    /* The Second Brain belongs to one person. It holds her own notes and her team’s documents, nothing else. */
    secondBrain: {
      person: 'Dana Whitlock',
      role: 'crew lead',
      documents: ['spring-cleanup', 'aeration-checklist', 'rain-delay', 'truck-checklist', 'dana-marlow-notes', 'dana-huddle-notes']
    },

    documents: [
      {
        id: 'spring-cleanup',
        title: 'Spring cleanup procedure',
        type: 'procedure',
        owner: 'Crews',
        date: '2026-02-16',
        roles: ALL,
        body: "A spring cleanup is one visit by a two-person crew. Clear leaves, sticks and winter debris from the beds and the lawn. Cut back perennials and ornamental grasses to four inches. Edge every bed along walks and drives. Prune only dead or broken wood; shaping shrubs is a separate job on the price sheet. Haul all debris away the same day. A standard lot takes three to four crew hours. Before leaving, the crew lead walks the property with the customer or leaves a door tag, then logs the visit with before and after photos."
      },
      {
        id: 'aeration-checklist',
        title: 'Aeration and overseeding checklist',
        type: 'checklist',
        owner: 'Crews',
        date: '2026-03-02',
        roles: ALL,
        body: "Before the machine comes off the trailer, flag every sprinkler head, valve box and shallow cable line. Aerate only when the soil is moist. If a screwdriver will not push in three inches by hand, reschedule. Make two passes at right angles. Leave the cores on the lawn to break down. Overseed at four pounds per 1,000 square feet with the tall fescue blend. Tell the customer to water lightly twice a day for the first two weeks. Log the lawn size and the seed used. Wash the tines before the machine goes back on the trailer."
      },
      {
        id: 'rain-delay',
        title: 'Rain delay policy',
        type: 'policy',
        owner: 'Crews',
        date: '2026-01-12',
        roles: ALL,
        body: "If more than a quarter inch of rain has fallen overnight, mowing and aeration visits are postponed. The crew lead makes the call by 6:30 a.m. and posts it in the crew channel. The office tells affected customers by 8:00 a.m. A postponed visit moves to the next open slot, and weekly customers keep their usual day the following week. Cleanup and planting visits go ahead in light rain unless the customer objects. No one runs a mower on a slope when the turf is wet. Crew members are paid a two-hour minimum on a day called off after they arrive."
      },
      {
        id: 'truck-checklist',
        title: 'Morning truck and trailer checklist',
        type: 'checklist',
        owner: 'Crews',
        date: '2026-02-02',
        roles: ALL,
        body: "Before leaving the yard, check tire pressure on the truck and the trailer. Test the trailer lights and the brake controller. Confirm the hitch pin and both safety chains. Strap every machine at two points. Fill the fuel cans; mixed fuel goes in the red can with the yellow cap and nowhere else. Each crew carries a first aid kit, two fire extinguishers, eye and ear protection for every person, and one spare trimmer head. The crew lead signs the sheet. A failed item is reported to Marcus before the truck moves."
      },
      {
        id: 'dana-marlow-notes',
        title: "Dana’s site notes: Marlow Court HOA",
        type: 'client record',
        owner: 'Dana Whitlock',
        date: '2026-03-18',
        roles: ALL,
        body: "The gate code changes on the first of each month. Get it from Marcus, not from the old door tag. Park the trailer on the east side by the clubhouse. The board wants mowing finished before 10:00 a.m. on Thursdays because the pool opens then. Irrigation zone 4 by the entrance sign leaks at the valve box; I reported it to the property manager on March 18. Do not blow clippings toward the pond. The resident at unit 12 asks us to skip the bed under her window. Mulch for the entrance beds goes down in the last week of April."
      },
      {
        id: 'dana-huddle-notes',
        title: "Dana’s notes: crew huddle, March 30",
        type: 'meeting note',
        owner: 'Dana Whitlock',
        date: '2026-03-30',
        roles: ALL,
        body: "Jo starts on April 6 and shadows me for two weeks. No solo trimmer work on slopes for Jo until I sign off. The aerator’s left tine bank drops slowly, so cycle it twice before the first pass. Trailer two has the good ramps, so the aerator rides on trailer two. Tomas’s crew takes the Henderson Road route on Tuesdays from April. We are one backpack blower short until the repair comes back, expected April 9. Remind everyone that ear protection is not optional, including on the short jobs."
      },
      {
        id: 'price-sheet',
        title: '2026 residential price sheet',
        type: 'price sheet',
        owner: 'Office',
        date: '2026-01-05',
        roles: ALL,
        body: "Prices for 2026, for lots up to 10,000 square feet. Spring cleanup: $285. Fall cleanup: $325. Weekly mowing: $48 per visit. Core aeration: $140. Aeration with overseeding: $245. Mulch, delivered and spread: $95 per cubic yard. Shrub pruning and shaping: $65 per crew hour. Lots over 10,000 square feet are quoted on site. Customers on a full-season mowing plan get 10 percent off aeration and cleanups. Prices hold through December 31, 2026. Any other discount needs the owner’s approval."
      },
      {
        id: 'reschedule-policy',
        title: 'Scheduling and reschedule policy',
        type: 'policy',
        owner: 'Office',
        date: '2026-01-12',
        roles: ALL,
        body: "A customer can move a visit at no charge with two business days’ notice. With less notice, a $35 return-trip fee applies, unless weather is the cause. The office offers the next open slot on the same crew’s route first. Cleanups are booked in half-day blocks: 8:00 a.m. to 12:00 p.m., or 12:30 to 4:30 p.m. Only the office changes the calendar. Crew leads send requests to Marcus. Every change is confirmed to the customer by email the same day. A visit moved twice goes to Renee before it is moved again."
      },
      {
        id: 'client-okafor',
        title: 'Client record: Okafor residence',
        type: 'client record',
        owner: 'Office',
        date: '2026-03-24',
        roles: ALL,
        body: "Customer: Ngozi Okafor, 418 Juniper Lane. Customer since 2024. Lot: 8,400 square feet, corner lot, no gate. Not on a mowing plan; books cleanups and one-off jobs. Spring cleanup booked for Tuesday, April 14, morning block, with Dana’s crew. Prefers email to phone calls. There is a dog in the back yard, so text before arriving and it will be brought inside. Asked about aeration last fall and did not book. The back bed holds water after rain; keep the wheelbarrow off it."
      },
      {
        id: 'monday-meeting',
        title: 'Monday planning meeting: April 6',
        type: 'meeting note',
        owner: 'Office',
        date: '2026-04-06',
        roles: ALL,
        body: "Present: Renee, Marcus, Dana, Tomas. Decided: mulch season starts on April 20, and Marcus orders 60 cubic yards for the first two weeks. Decided: aeration bookings close on May 15, when the machine goes in for service. Jo started today on Dana’s crew. Tomas’s crew takes the Henderson Road route on Tuesdays. Open item: a second aerator. Renee will decide by April 30, after she has seen the March numbers. Marcus sends the spring newsletter by April 10. Next meeting: Monday, April 13, at 7:00 a.m. in the yard office."
      },
      {
        id: 'billing-marlow',
        title: 'Billing record: Marlow Court HOA',
        type: 'client record',
        owner: 'Office',
        date: '2026-04-01',
        roles: OFFICE,
        body: "Contract: grounds maintenance, March through November 2026, at $2,150 a month. Billed on the first of the month, due in 30 days. The March invoice was paid on March 27. The April invoice was sent on April 1 and is open. One late payment in 2025: September, paid 19 days late, and Renee waived the late fee. Billing goes to the property manager, not to the board. Extras need a written work order and are billed separately. The zone 4 irrigation repair is quoted at $380 and is not yet approved."
      },
      {
        id: 'unpaid-invoices',
        title: 'Unpaid invoices: March 31',
        type: 'client record',
        owner: 'Office',
        date: '2026-03-31',
        roles: OFFICE,
        body: "Open invoices on March 31, 2026: $6,840 across seven customers. Under 30 days: $4,120. Between 30 and 60 days: $1,410. Over 60 days: two accounts, $1,310 in total. Hollis residence: $890 for fall cleanup and mulch, 74 days old; two installments were agreed on March 20. Brandt residence: $420, 66 days old; a second reminder went out on March 25 with no reply. No new work is booked for an account over 60 days until it is paid or Renee approves."
      },
      {
        id: 'pay-rates',
        title: 'Crew pay rates 2026',
        type: 'policy',
        owner: 'Renee Calloway',
        date: '2026-01-02',
        roles: OWNER,
        body: "Hourly rates from January 1, 2026. Crew member in a first season: $19.00. Returning crew member: $21.50. Crew lead: $27.00. Overtime is time and a half after 40 hours in a week. Season-end bonus: $500 for crew members and $1,000 for crew leads who work through November 20 with no safety write-ups. Rates are reviewed once a year, in December. Individual rates are not discussed in crew meetings. Questions about pay go to Renee."
      },
      {
        id: 'bank-review',
        title: 'Bank review meeting: January 22',
        type: 'meeting note',
        owner: 'Renee Calloway',
        date: '2026-01-22',
        roles: OWNER,
        body: "Met the bank about the equipment loan taken in 2024 for the two trucks and the aerator. Balance: $86,400. Payment: $2,340 a month through June 2029. Covenant: debt service coverage must stay at or above 1.25, tested once a year on the December 31 figures. For 2025 it was 1.41. The bank must approve any new borrowing over $25,000 while the loan is open. A second aerator at about $11,000 is under that line and needs no approval, but it would lower coverage for 2026."
      }
    ],

    /* Ten prepared questions. `passages` are exact pieces of the cited document.
       `noAnswer` marks the question the documents cannot answer; its source is the closest document, not a basis. */
    questions: [
      {
        id: 'cleanup-scope',
        question: 'What is included in a spring cleanup?',
        keywords: ['spring', 'cleanup', 'clean up', 'include', 'scope', 'debris', 'prune', 'edge', 'beds'],
        answer: 'Clearing leaves and winter debris, cutting back perennials and grasses to four inches, edging the beds and pruning dead or broken wood. The debris is hauled away the same day. Shaping shrubs is a separate job.',
        sources: [{
          doc: 'spring-cleanup',
          passages: [
            'Clear leaves, sticks and winter debris from the beds and the lawn. Cut back perennials and ornamental grasses to four inches. Edge every bed along walks and drives. Prune only dead or broken wood; shaping shrubs is a separate job on the price sheet. Haul all debris away the same day.'
          ]
        }]
      },
      {
        id: 'marlow-site',
        question: 'What should a crew know before working at Marlow Court?',
        keywords: ['marlow', 'court', 'hoa', 'gate', 'code', 'site', 'park', 'trailer', 'pond', 'mowing'],
        answer: "Get this month’s gate code from Marcus, park the trailer on the east side by the clubhouse, and finish mowing before 10:00 a.m. on Thursdays. Do not blow clippings toward the pond.",
        sources: [{
          doc: 'dana-marlow-notes',
          passages: [
            'Get it from Marcus, not from the old door tag. Park the trailer on the east side by the clubhouse. The board wants mowing finished before 10:00 a.m. on Thursdays',
            'Do not blow clippings toward the pond.'
          ]
        }]
      },
      {
        id: 'aeration-price',
        question: 'What does core aeration cost?',
        keywords: ['aeration', 'aerate', 'price', 'cost', 'how much', 'overseeding', 'lawn', 'discount'],
        answer: '$140 for a lot up to 10,000 square feet, or $245 with overseeding. Customers on a full-season mowing plan get 10 percent off.',
        sources: [{
          doc: 'price-sheet',
          passages: [
            'Core aeration: $140. Aeration with overseeding: $245.',
            'Customers on a full-season mowing plan get 10 percent off aeration and cleanups.'
          ]
        }]
      },
      {
        id: 'rain',
        question: 'Do we mow after rain?',
        keywords: ['rain', 'weather', 'wet', 'mow', 'mowing', 'postpone', 'delay', 'slope'],
        answer: 'Not if more than a quarter inch has fallen overnight. The crew lead makes the call by 6:30 a.m., and no one runs a mower on a wet slope.',
        sources: [{
          doc: 'rain-delay',
          passages: [
            'If more than a quarter inch of rain has fallen overnight, mowing and aeration visits are postponed. The crew lead makes the call by 6:30 a.m.',
            'No one runs a mower on a slope when the turf is wet.'
          ]
        }]
      },
      {
        id: 'reschedule-fee',
        question: 'A customer wants to move a visit. Is there a fee?',
        keywords: ['move', 'reschedule', 'change', 'visit', 'fee', 'charge', 'notice', 'booking', 'calendar'],
        answer: "No fee with two business days’ notice. With less notice a $35 return-trip fee applies, unless weather is the cause.",
        sources: [{
          doc: 'reschedule-policy',
          passages: [
            "A customer can move a visit at no charge with two business days’ notice. With less notice, a $35 return-trip fee applies, unless weather is the cause."
          ]
        }]
      },
      {
        id: 'new-hire',
        question: "Who is new on Dana’s crew, and what can they not do yet?",
        keywords: ['new', 'hire', 'jo', 'crew', 'dana', 'trimmer', 'slopes', 'training', 'shadow'],
        answer: 'Jo, who starts on April 6 and shadows Dana for two weeks. Jo does no solo trimmer work on slopes until Dana signs off.',
        sources: [{
          doc: 'dana-huddle-notes',
          passages: [
            'Jo starts on April 6 and shadows me for two weeks. No solo trimmer work on slopes for Jo until I sign off.'
          ]
        }]
      },
      {
        id: 'mulch',
        question: 'When does mulch season start, and what does mulch cost?',
        keywords: ['mulch', 'season', 'start', 'price', 'cost', 'how much', 'cubic', 'yard'],
        answer: 'Mulch season starts on April 20. Mulch costs $95 per cubic yard, delivered and spread.',
        sources: [
          { doc: 'monday-meeting', passages: ['mulch season starts on April 20'] },
          { doc: 'price-sheet', passages: ['Mulch, delivered and spread: $95 per cubic yard.'] }
        ]
      },
      {
        id: 'first-mow',
        question: 'How long after overseeding before the first mow?',
        keywords: ['overseeding', 'overseed', 'seed', 'mow', 'mowing', 'first', 'wait', 'how long', 'aeration'],
        noAnswer: true,
        answer: 'The documents do not say. The aeration and overseeding checklist covers watering for the first two weeks, and nothing in it gives a wait before mowing.',
        sources: [{
          doc: 'aeration-checklist',
          passages: ['Tell the customer to water lightly twice a day for the first two weeks.']
        }]
      },
      {
        id: 'marlow-billing',
        question: 'Is Marlow Court HOA paid up?',
        keywords: ['marlow', 'court', 'hoa', 'paid', 'payment', 'invoice', 'billing', 'bill', 'owe', 'money'],
        answer: 'March is paid. The April invoice was sent on April 1 and is open.',
        sources: [{
          doc: 'billing-marlow',
          passages: ['The March invoice was paid on March 27. The April invoice was sent on April 1 and is open.']
        }]
      },
      {
        id: 'lead-pay',
        question: 'What does a crew lead earn per hour?',
        keywords: ['pay', 'wage', 'earn', 'salary', 'hourly', 'rate', 'crew lead', 'overtime', 'money'],
        answer: '$27.00 an hour from January 1, 2026. Overtime is time and a half after 40 hours in a week.',
        sources: [{
          doc: 'pay-rates',
          passages: ['Crew lead: $27.00. Overtime is time and a half after 40 hours in a week.']
        }]
      }
    ]
  };
})();
