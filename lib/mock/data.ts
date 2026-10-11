/**
 * MOCK DATA — replace with real sources later:
 *  - patients / conversations / messages → database (fed by n8n + WhatsApp Cloud API)
 *  - appointments → Google Calendar sync
 *
 * Nothing outside `lib/data.ts` should import this file directly.
 */
import type { Appointment, Conversation, Patient, StaffUser } from "@/lib/types";

/** Fixed "now" so mock timestamps render deterministically (no hydration drift). */
export const MOCK_NOW = "2026-10-10T16:00:00+02:00";

export const mockClinic = {
  name: "Clinica Estetica Aurora",
  city: "Milano",
  whatsappNumber: "+39 02 8734 1190",
  timezone: "Europe/Rome",
  openingHours: "Mon–Fri 09:00–19:00 · Sat 09:00–13:00",
};

export const mockCurrentUser: StaffUser = {
  id: "staff_martina",
  name: "Martina Colombo",
  role: "Reception",
};

export const mockPatients: Patient[] = [
  { id: "pat_marco", name: "Marco Rossi", phone: "+39 347 512 8890", treatmentInterest: "Filler labbra" },
  { id: "pat_giulia", name: "Giulia Bianchi", phone: "+39 333 908 1145", treatmentInterest: "Tossina botulinica (fronte)" },
  { id: "pat_elena", name: "Elena Ricci", phone: "+39 340 221 7763", treatmentInterest: "Filler zigomi" },
  { id: "pat_sofia", name: "Sofia Esposito", phone: "+39 328 664 0192", treatmentInterest: "Peeling chimico" },
  { id: "pat_francesca", name: "Francesca Romano", phone: "+39 349 117 5530", treatmentInterest: "Biorivitalizzazione viso" },
  { id: "pat_luca", name: "Luca Ferrari", phone: "+39 335 780 4412", treatmentInterest: "Epilazione laser" },
  { id: "pat_alessandro", name: "Alessandro Conti", phone: "+39 366 402 9981", treatmentInterest: "Radiofrequenza viso" },
  { id: "pat_chiara", name: "Chiara Marino", phone: "+39 320 554 3307", treatmentInterest: "Skinbooster" },
];

export const mockAppointments: Appointment[] = [
  {
    id: "apt_1001",
    patientId: "pat_marco",
    treatment: "Filler labbra — controllo post-trattamento",
    startsAt: "2026-10-14T09:30:00+02:00",
    durationMinutes: 30,
    practitioner: "Dr.ssa Laura Galli",
    room: "Studio 2",
    status: "confirmed",
    notes: "Trattamento acido ialuronico 0,5 ml eseguito il 07/10.",
  },
  {
    id: "apt_1002",
    patientId: "pat_giulia",
    treatment: "Tossina botulinica — prima visita",
    startsAt: "2026-10-16T11:00:00+02:00",
    durationMinutes: 45,
    practitioner: "Dr. Paolo Mancini",
    room: "Studio 1",
    status: "confirmed",
  },
  {
    id: "apt_1003",
    patientId: "pat_sofia",
    treatment: "Peeling chimico",
    startsAt: "2026-10-13T15:00:00+02:00",
    durationMinutes: 40,
    practitioner: "Dr.ssa Laura Galli",
    room: "Studio 2",
    status: "pending",
  },
  {
    id: "apt_1004",
    patientId: "pat_luca",
    treatment: "Epilazione laser — schiena (seduta 3/6)",
    startsAt: "2026-10-12T18:00:00+02:00",
    durationMinutes: 60,
    practitioner: "Valentina Greco",
    room: "Sala Laser",
    status: "confirmed",
  },
  {
    id: "apt_1005",
    patientId: "pat_alessandro",
    treatment: "Radiofrequenza viso",
    startsAt: "2026-10-20T17:30:00+02:00",
    durationMinutes: 45,
    practitioner: "Valentina Greco",
    room: "Studio 3",
    status: "confirmed",
    notes: "Spostato dal 15/10 su richiesta del paziente.",
  },
  {
    id: "apt_1006",
    patientId: "pat_chiara",
    treatment: "Skinbooster — seduta 2/3",
    startsAt: "2026-10-22T10:00:00+02:00",
    durationMinutes: 30,
    practitioner: "Dr. Paolo Mancini",
    room: "Studio 1",
    status: "confirmed",
  },
  {
    id: "apt_0998",
    patientId: "pat_marco",
    treatment: "Filler labbra",
    startsAt: "2026-10-07T12:00:00+02:00",
    durationMinutes: 45,
    practitioner: "Dr.ssa Laura Galli",
    room: "Studio 2",
    status: "completed",
  },
];

const patient = (id: string) => mockPatients.find((p) => p.id === id)!;
const appointment = (id: string) => mockAppointments.find((a) => a.id === id)!;

export const mockConversations: Conversation[] = [
  {
    id: "conv_marco",
    patient: patient("pat_marco"),
    mode: "HUMAN",
    unreadCount: 2,
    handoff: {
      kind: "medical",
      reason: "Medical question after treatment",
      requestedAt: "2026-10-10T15:42:00+02:00",
    },
    appointment: appointment("apt_1001"),
    messages: [
      { id: "m1", sender: "patient", text: "Buongiorno, ho fatto il filler alle labbra martedì scorso.", sentAt: "2026-10-10T15:38:00+02:00" },
      { id: "m2", sender: "ai", text: "Buongiorno Marco, grazie per averci scritto. Come si sente dopo il trattamento?", sentAt: "2026-10-10T15:38:30+02:00" },
      { id: "m3", sender: "patient", text: "Il labbro superiore è ancora un po' gonfio e c'è un piccolo livido sul lato sinistro. È normale dopo 3 giorni?", sentAt: "2026-10-10T15:41:00+02:00" },
      { id: "m4", sender: "ai", text: "Capisco. Per domande cliniche preferisco metterla subito in contatto con il nostro staff medico, così riceve una risposta accurata. Un momento, la sto trasferendo.", sentAt: "2026-10-10T15:42:00+02:00" },
      { id: "m5", sender: "staff", authorName: "Martina · Reception", text: "Ciao Marco, sono Martina. Ho avvisato la Dr.ssa Galli, ti risponde a breve. Nel frattempo, hai febbre o dolore forte?", sentAt: "2026-10-10T15:47:00+02:00" },
      { id: "m6", sender: "patient", text: "No, nessuna febbre. Solo un leggero fastidio quando lo tocco.", sentAt: "2026-10-10T15:56:00+02:00" },
      { id: "m7", sender: "patient", text: "Posso mettere del ghiaccio?", sentAt: "2026-10-10T15:59:00+02:00" },
    ],
  },
  {
    id: "conv_elena",
    patient: patient("pat_elena"),
    mode: "AI",
    unreadCount: 3,
    handoff: null,
    appointment: null,
    messages: [
      { id: "m1", sender: "patient", text: "Salve, vorrei informazioni sul filler agli zigomi.", sentAt: "2026-10-10T15:20:00+02:00" },
      { id: "m2", sender: "ai", text: "Buongiorno Elena! Il filler zigomatico con acido ialuronico restituisce volume e definizione al terzo medio del viso. Il primo passo è una visita di consulenza con il medico (30 min, 80 €, scalabili dal trattamento).", sentAt: "2026-10-10T15:20:40+02:00" },
      { id: "m3", sender: "patient", text: "Quanto dura il risultato?", sentAt: "2026-10-10T15:31:00+02:00" },
      { id: "m4", sender: "ai", text: "In media 12–18 mesi, a seconda del prodotto e del metabolismo. Il medico le darà un'indicazione personalizzata durante la visita.", sentAt: "2026-10-10T15:31:20+02:00" },
      { id: "m5", sender: "patient", text: "Perfetto. Avete disponibilità la prossima settimana?", sentAt: "2026-10-10T15:44:00+02:00" },
      { id: "m6", sender: "ai", text: "Certo! Ho questi orari liberi: martedì 13 alle 16:00, mercoledì 14 alle 11:30 o giovedì 15 alle 18:00. Quale preferisce?", sentAt: "2026-10-10T15:44:15+02:00" },
      { id: "m7", sender: "patient", text: "Mercoledì alle 11:30 va benissimo", sentAt: "2026-10-10T15:58:00+02:00" },
    ],
  },
  {
    id: "conv_sofia",
    patient: patient("pat_sofia"),
    mode: "HUMAN",
    unreadCount: 1,
    handoff: {
      kind: "medical",
      reason: "Possible allergy before chemical peel",
      requestedAt: "2026-10-10T14:05:00+02:00",
    },
    appointment: appointment("apt_1003"),
    messages: [
      { id: "m1", sender: "patient", text: "Ciao, lunedì ho il peeling. Sono allergica all'aspirina, può essere un problema?", sentAt: "2026-10-10T14:03:00+02:00" },
      { id: "m2", sender: "ai", text: "Grazie per la segnalazione, Sofia. È un'informazione importante: la passo subito al medico che valuterà il suo caso prima dell'appuntamento.", sentAt: "2026-10-10T14:05:00+02:00" },
      { id: "m3", sender: "patient", text: "Grazie, attendo notizie.", sentAt: "2026-10-10T14:20:00+02:00" },
    ],
  },
  {
    id: "conv_giulia",
    patient: patient("pat_giulia"),
    mode: "AI",
    unreadCount: 0,
    handoff: null,
    appointment: appointment("apt_1002"),
    messages: [
      { id: "m1", sender: "patient", text: "Buongiorno, vorrei prenotare una visita per il botox sulla fronte.", sentAt: "2026-10-10T11:02:00+02:00" },
      { id: "m2", sender: "ai", text: "Buongiorno Giulia! Posso proporle venerdì 16 ottobre alle 11:00 con il Dr. Mancini. Le va bene?", sentAt: "2026-10-10T11:02:20+02:00" },
      { id: "m3", sender: "patient", text: "Sì, perfetto.", sentAt: "2026-10-10T11:05:00+02:00" },
      { id: "m4", sender: "ai", text: "Fatto! Appuntamento confermato: venerdì 16 ottobre, ore 11:00, Studio 1. Le invieremo un promemoria il giorno prima. Si ricordi di arrivare senza trucco.", sentAt: "2026-10-10T11:05:10+02:00" },
      { id: "m5", sender: "patient", text: "Grazie mille!", sentAt: "2026-10-10T11:06:00+02:00" },
    ],
  },
  {
    id: "conv_luca",
    patient: patient("pat_luca"),
    mode: "HUMAN",
    unreadCount: 0,
    handoff: {
      kind: "administrative",
      reason: "Invoice request for company reimbursement",
      requestedAt: "2026-10-10T10:12:00+02:00",
    },
    appointment: appointment("apt_1004"),
    messages: [
      { id: "m1", sender: "patient", text: "Salve, mi servirebbe la fattura delle ultime due sedute intestata alla mia azienda.", sentAt: "2026-10-10T10:10:00+02:00" },
      { id: "m2", sender: "ai", text: "Certamente, Luca. Inoltro la richiesta alla segreteria amministrativa che le preparerà la fattura.", sentAt: "2026-10-10T10:12:00+02:00" },
      { id: "m3", sender: "staff", authorName: "Martina · Reception", text: "Buongiorno Luca, mi può inviare ragione sociale e partita IVA? Gliela mando entro oggi.", sentAt: "2026-10-10T10:30:00+02:00" },
      { id: "m4", sender: "patient", text: "Ferrari Consulting Srl, P.IVA 09876543210. Grazie!", sentAt: "2026-10-10T10:41:00+02:00" },
    ],
  },
  {
    id: "conv_francesca",
    patient: patient("pat_francesca"),
    mode: "AI",
    unreadCount: 1,
    handoff: null,
    appointment: null,
    messages: [
      { id: "m1", sender: "patient", text: "Ciao! Quanto costa la biorivitalizzazione?", sentAt: "2026-10-09T19:12:00+02:00" },
      { id: "m2", sender: "ai", text: "Ciao Francesca! Il protocollo di biorivitalizzazione viso prevede 3 sedute a distanza di 2 settimane. Il costo è di 180 € a seduta oppure 480 € per il pacchetto completo.", sentAt: "2026-10-09T19:12:30+02:00" },
      { id: "m3", sender: "patient", text: "Ok ci penso e vi faccio sapere", sentAt: "2026-10-09T19:20:00+02:00" },
    ],
  },
  {
    id: "conv_alessandro",
    patient: patient("pat_alessandro"),
    mode: "AI",
    unreadCount: 0,
    handoff: null,
    appointment: appointment("apt_1005"),
    messages: [
      { id: "m1", sender: "patient", text: "Buonasera, devo spostare l'appuntamento di giovedì 15, ho un impegno di lavoro.", sentAt: "2026-10-09T18:01:00+02:00" },
      { id: "m2", sender: "ai", text: "Nessun problema, Alessandro. Le propongo martedì 20 ottobre alle 17:30 oppure mercoledì 21 alle 12:00.", sentAt: "2026-10-09T18:01:25+02:00" },
      { id: "m3", sender: "patient", text: "Martedì 20 va bene", sentAt: "2026-10-09T18:09:00+02:00" },
      { id: "m4", sender: "ai", text: "Perfetto, l'appuntamento è stato spostato a martedì 20 ottobre alle 17:30. A presto!", sentAt: "2026-10-09T18:09:10+02:00" },
    ],
  },
  {
    id: "conv_chiara",
    patient: patient("pat_chiara"),
    mode: "AI",
    unreadCount: 0,
    handoff: null,
    appointment: appointment("apt_1006"),
    messages: [
      { id: "m1", sender: "ai", text: "Ciao Chiara, ti ricordiamo la seconda seduta di Skinbooster giovedì 22 ottobre alle 10:00. Rispondi SÌ per confermare.", sentAt: "2026-10-08T09:00:00+02:00" },
      { id: "m2", sender: "patient", text: "Sì, confermo", sentAt: "2026-10-08T09:47:00+02:00" },
      { id: "m3", sender: "ai", text: "Grazie, confermato! A presto.", sentAt: "2026-10-08T09:47:05+02:00" },
    ],
  },
];
