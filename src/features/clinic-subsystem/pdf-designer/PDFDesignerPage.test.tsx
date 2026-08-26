import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PDFDesignerPage } from './PDFDesignerPage';

vi.mock('./optimizeUploadedImage', () => ({
  optimizeUploadedImage: vi.fn().mockResolvedValue('data:image/webp;base64,optimized')
}));

describe('PDFDesignerPage settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists an edited setting only when Save Configuration is used', () => {
    render(<PDFDesignerPage currentClinic={{ name: 'Main Branch' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Modify PDF' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Clinic Name' }), {
      target: { value: 'Saved Dental Clinic' }
    });

    expect(localStorage.getItem('masterFileModifyPdfSettings')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }));

    const saved = JSON.parse(localStorage.getItem('masterFileModifyPdfSettings') || '{}');
    expect(saved.clinicName).toBe('Saved Dental Clinic');
    expect(screen.getAllByText('Saved Dental Clinic').length).toBeGreaterThan(0);
  });

  it('saves the current design when locking and blocks edits until Modify PDF is used', () => {
    render(<PDFDesignerPage currentClinic={{ name: 'Main Branch' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Modify PDF' }));
    const clinicName = screen.getByRole('textbox', { name: 'Clinic Name' });
    fireEvent.change(clinicName, { target: { value: 'Locked Dental Clinic' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lock Template' }));

    const saved = JSON.parse(localStorage.getItem('masterFileModifyPdfSettings') || '{}');
    expect(saved.clinicName).toBe('Locked Dental Clinic');
    expect(saved.locked).toBe(true);
    expect(clinicName).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save Configuration' })).toBeDisabled();

    fireEvent.change(clinicName, { target: { value: 'Blocked Change' } });
    expect(clinicName).toHaveValue('Locked Dental Clinic');

    fireEvent.click(screen.getByRole('button', { name: 'Modify PDF' }));
    expect(clinicName).toBeEnabled();
    fireEvent.change(clinicName, { target: { value: 'Editable Again' } });
    expect(clinicName).toHaveValue('Editable Again');
  });

  it('uses selected export pages to build the multi-page document set', () => {
    const { container } = render(<PDFDesignerPage currentClinic={{ name: 'Main Branch' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Modify PDF' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Consent Form' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Certificate Form' }));

    expect(container.querySelectorAll('.pdf-designer__export-page')).toHaveLength(4);
    expect(screen.getByText('4 pages selected for export.')).toBeInTheDocument();
  });

  it('shows only the settings section for the selected form', () => {
    render(<PDFDesignerPage currentClinic={{ name: 'Main Branch' }} />);
    const settingsNavigation = screen.getByRole('navigation', { name: 'Document settings' });

    expect(screen.getByText('Patient Form Sections')).toBeInTheDocument();
    expect(screen.queryByText('Dental Chart Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Treatment Record Settings')).not.toBeInTheDocument();

    fireEvent.click(within(settingsNavigation).getByRole('button', { name: 'Dental Chart' }));

    expect(screen.getByText('Dental Chart Settings')).toBeInTheDocument();
    expect(screen.queryByText('Patient Form Sections')).not.toBeInTheDocument();
    expect(screen.queryByText('Certificate Form Settings')).not.toBeInTheDocument();

    fireEvent.click(within(settingsNavigation).getByRole('button', { name: 'Certificate Form' }));

    expect(screen.getByText('Certificate Form Settings')).toBeInTheDocument();
    expect(screen.queryByText('Dental Chart Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Consent Form Settings')).not.toBeInTheDocument();
  });

  it('prepares and persists uploaded branding with the rest of the configuration', async () => {
    render(<PDFDesignerPage currentClinic={{ name: 'Main Branch' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Modify PDF' }));
    fireEvent.change(screen.getAllByLabelText('Upload')[0], {
      target: {
        files: [new File(['large source image'], 'clinic-logo.png', { type: 'image/png' })]
      }
    });

    await waitFor(() => {
      expect(screen.getByText(
        'Image prepared. Select Save Configuration to publish the changes.'
      )).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }));

    const saved = JSON.parse(localStorage.getItem('masterFileModifyPdfSettings') || '{}');
    expect(saved.leftImageName).toBe('data:image/webp;base64,optimized');
    expect(screen.getByText(
      'Configuration saved and synchronized with patient documents.'
    )).toBeInTheDocument();
  });
});
