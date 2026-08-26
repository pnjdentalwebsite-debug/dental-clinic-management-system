export type ScheduleStatus = 'Scheduled' | 'Confirmed' | 'Waiting' | 'In Treatment' | 'Completed' | 'Cancelled' | 'No Show';

export interface ScheduleAppointment {
  id: string;
  clinicId?: string;
  clinicName?: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  procedure: string;
  dentist?: string;
  status: ScheduleStatus;
}

export type CalendarScheduleType =
  | 'appointments'
  | 'recalls'
  | 'birthdays'
  | 'events'
  | 'online'
  | 'google';

export interface CalendarScheduleItem extends ScheduleAppointment {
  title: string;
  type: CalendarScheduleType;
  startTime?: string;
  endTime?: string;
  treatmentTag?: string;
  notes?: string;
  gender?: string;
  age?: number;
  birthday?: string;
  city?: string;
  source?: 'manual' | 'progress-note-recall';
  sourceId?: string;
  linkedAppointmentId?: string;
}
