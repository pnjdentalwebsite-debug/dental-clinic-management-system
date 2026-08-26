import type { ReactNode } from 'react';
import type { PatientPreviewItem } from './patientTypes';

interface Props {
  patient: PatientPreviewItem;
}

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="patient-record__card">
    <h3>{title}</h3>
    {children}
  </section>
);

export function PatientInformationSection({ patient }: Props) {
  return (
    <div className="patient-record__sections">
      <Card title="Personal Information">
        <dl className="patient-record__dl">
          <div><dt>Full Name</dt><dd>{patient.name}</dd></div>
          <div><dt>Birth Date</dt><dd>{patient.birthDate}</dd></div>
          <div><dt>Age</dt><dd>{calculateAge(patient.birthDate)}</dd></div>
          <div><dt>Sex</dt><dd>{patient.sex}</dd></div>
          <div><dt>Address</dt><dd>{patient.address}</dd></div>
          <div><dt>Contact</dt><dd>{patient.contact}</dd></div>
        </dl>
      </Card>

      <Card title="Dental Information">
        <dl className="patient-record__dl">
          <div><dt>First Visit</dt><dd>{patient.firstVisit}</dd></div>
          <div><dt>Recall Date</dt><dd>{patient.recallDate}</dd></div>
          <div><dt>Dental Notes</dt><dd>{patient.dentalNotes}</dd></div>
        </dl>
      </Card>

      <Card title="Medical Information">
        <dl className="patient-record__dl">
          <div><dt>Medical History</dt><dd>{patient.medicalHistory}</dd></div>
          <div><dt>Allergies</dt><dd>{patient.allergies}</dd></div>
          <div><dt>Medical Notes</dt><dd>{patient.medicalNotes}</dd></div>
        </dl>
      </Card>

      <Card title="Appointment History">
        <div className="patient-record__history">
          <div>
            <strong>Previous Appointments</strong>
            <ul>
              {patient.previousAppointments.map((entry) => <li key={entry}>{entry}</li>)}
            </ul>
          </div>
          <div>
            <strong>Upcoming Appointments</strong>
            <ul>
              {patient.upcomingAppointments.map((entry) => <li key={entry}>{entry}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <Card title="Balance Information">
        <p className="patient-record__balance">{patient.balance}</p>
      </Card>
    </div>
  );
}

function calculateAge(birthDate: string) {
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDelta = today.getMonth() - parsed.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < parsed.getDate())) age -= 1;
  return String(age);
}
